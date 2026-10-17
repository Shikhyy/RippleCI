"""Impact analyzer tracing change blast radius using FalkorDB / GraphStore."""

from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set
import uuid

from rippleci.core.config import RippleConfig
from rippleci.core.models import (
    CandidateTest,
    EvidencePath,
    ImpactReport,
    ImpactedSymbol,
    SymbolKind,
    SymbolNode,
    TestCaseNode,
)
from rippleci.graph.store import GraphStore
from rippleci.impact.diff import FileDiff, get_git_diff, map_diff_to_symbols


class ImpactAnalyzer:
    """Computes blast radius and candidate tests from code modifications."""

    def __init__(self, repo_root: Path, config: RippleConfig, graph_store: GraphStore):
        self.repo_root = repo_root
        self.config = config
        self.store = graph_store
        self.repo_id = config.repository.id

    def analyze(
        self,
        base: str = "origin/main",
        head: str = "HEAD",
        file_diffs: Optional[List[FileDiff]] = None,
        raw_diff: str = "",
    ) -> ImpactReport:
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Resolve diff
        if file_diffs is None:
            diff_result = get_git_diff(self.repo_root, base, head)
            file_diffs = diff_result.files
            base_sha = diff_result.base_sha
            head_sha = diff_result.head_sha
        else:
            base_sha = "custom_base"
            head_sha = "custom_head"

        changed_file_paths = [fd.file_path for fd in file_diffs]
        warnings: List[str] = []

        if not file_diffs:
            return ImpactReport(
                run_id=run_id,
                repo_id=self.repo_id,
                base_ref=base,
                head_ref=head,
                base_sha=base_sha,
                head_sha=head_sha,
                changed_files=[],
                changed_symbols=[],
                impacted_symbols=[],
                candidate_tests=[],
                evidence_paths=[],
                warnings=["Empty diff detected: no files modified."],
                completeness_status="complete",
                recommendation="proceed",
                created_at=now_iso,
            )

        # 2. Map changed lines to symbols in graph
        # Retrieve all symbols from the graph
        known_symbols: List[SymbolNode] = []
        if hasattr(self.store, "symbols") and isinstance(self.store.symbols, dict):
            known_symbols = list(self.store.symbols.values())
        else:
            # Query from FalkorDB store
            counts = self.store.get_graph_counts()
            # If store is FalkorGraphStore, fetch symbols
            if hasattr(self.store, "_connect"):
                graph = self.store._connect()
                res = graph.query(
                    "MATCH (s:Symbol) RETURN s.id, s.name, s.qualified_name, s.kind, s.file_path, s.start_line, s.end_line"
                )
                for r in res.result_set:
                    known_symbols.append(
                        SymbolNode(
                            id=r[0],
                            repo_id=self.repo_id,
                            name=r[1],
                            qualified_name=r[2],
                            kind=SymbolKind(r[3]),
                            file_path=r[4],
                            start_line=r[5],
                            end_line=r[6],
                        )
                    )

        changed_symbols = map_diff_to_symbols(file_diffs, known_symbols)
        changed_symbol_ids = [s.id for s in changed_symbols]

        # Check for non-symbol changes
        for fd in file_diffs:
            if not fd.file_path.endswith(".py"):
                warnings.append(
                    f"Non-Python file changed: '{fd.file_path}'. Static symbol analysis not available."
                )
            else:
                # Check if any symbol matched in this file
                file_syms = [s for s in changed_symbols if s.file_path == fd.file_path]
                if not file_syms and (fd.added_lines or fd.modified_lines or fd.deleted_lines):
                    warnings.append(
                        f"Changes in '{fd.file_path}' (lines {fd.modified_lines[:5]}...) do not intersect any indexed function/class."
                    )

        # 3. Query callers of changed symbols
        max_depth = self.config.analysis.max_call_depth
        callers = self.store.get_callers_of_symbols(changed_symbol_ids, max_depth=max_depth)

        impacted_symbols: List[ImpactedSymbol] = []
        evidence_paths: List[EvidencePath] = []
        impacted_symbol_ids_set = set(changed_symbol_ids)

        for c in callers:
            caller_sym = SymbolNode(
                id=c["caller_id"],
                repo_id=self.repo_id,
                name=c["caller_name"],
                qualified_name=c["caller_qualified_name"],
                kind=SymbolKind(c["kind"]),
                file_path=c["file_path"],
                start_line=c["start_line"],
                end_line=c["end_line"],
            )
            impacted_symbol_ids_set.add(c["caller_id"])

            impacted_symbols.append(
                ImpactedSymbol(
                    symbol=caller_sym,
                    hops_from_change=c["hops"],
                    path_to_change=c["path_names"],
                    source_kind="calls",
                )
            )

            # Record evidence path
            path_id = f"path_{uuid.uuid4().hex[:8]}"
            evidence_paths.append(
                EvidencePath(
                    id=path_id,
                    changed_symbol_id=c["changed_symbol_id"],
                    target_id=c["caller_id"],
                    hops=c["hops"],
                    node_names=c["path_names"],
                    relationship_types=["CALLS"] * c["hops"],
                    source_kind="ast_call_graph",
                )
            )

        # 4. Discover candidate tests covering any impacted symbol
        all_impacted_ids = list(impacted_symbol_ids_set)
        test_rows = self.store.get_candidate_tests(all_impacted_ids)

        candidate_tests: List[CandidateTest] = []
        covered_changed_symbols: Set[str] = set()

        for t in test_rows:
            test_node = TestCaseNode(
                id=t["test_id"],
                repo_id=self.repo_id,
                node_id=t["node_id"],
                name=t["test_name"],
                file_path=t["file_path"],
                framework="pytest",
            )
            ev_syms = t["evidence_symbols"]
            is_direct = any(sid in changed_symbol_ids for sid in ev_syms)
            if is_direct:
                for sid in ev_syms:
                    if sid in changed_symbol_ids:
                        covered_changed_symbols.add(sid)

            # Determine shortest hops from test to changed symbol
            shortest_hops = 1 if is_direct else 2

            # Find matching evidence path IDs
            matching_path_ids = [
                ep.id for ep in evidence_paths if ep.target_id in ev_syms or ep.changed_symbol_id in ev_syms
            ]

            candidate_tests.append(
                CandidateTest(
                    test_case=test_node,
                    evidence_symbols=ev_syms,
                    shortest_hops=shortest_hops,
                    direct_coverage=is_direct,
                    estimated_duration_seconds=1.2,
                    history_failures_count=0,
                    history_runs_count=1,
                    evidence_path_ids=matching_path_ids,
                )
            )

        # 5. Check completeness and missing coverage
        uncovered_changed = [
            s.qualified_name for s in changed_symbols if s.id not in covered_changed_symbols
        ]
        if uncovered_changed:
            warnings.append(
                f"Missing direct test coverage for changed symbols: {', '.join(uncovered_changed)}"
            )

        if not candidate_tests and changed_symbols:
            warnings.append(
                "Zero candidate tests identified in dependency graph. Full-suite execution recommended."
            )
            completeness = "partial"
            recommendation = "full_suite_fallback"
        elif uncovered_changed:
            completeness = "partial"
            recommendation = "review_required"
        else:
            completeness = "complete"
            recommendation = "proceed"

        return ImpactReport(
            run_id=run_id,
            repo_id=self.repo_id,
            base_ref=base,
            head_ref=head,
            base_sha=base_sha,
            head_sha=head_sha,
            changed_files=changed_file_paths,
            changed_symbols=changed_symbols,
            impacted_symbols=impacted_symbols,
            candidate_tests=candidate_tests,
            evidence_paths=evidence_paths,
            warnings=warnings,
            completeness_status=completeness,
            recommendation=recommendation,
            created_at=now_iso,
        )

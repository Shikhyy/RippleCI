"""Indexing pipeline coordinating file scanning, AST parsing, test collection, and graph upsert."""

import hashlib
import os
from pathlib import Path
import subprocess
import time
from typing import Dict, List, Optional, Set, Tuple

from rippleci.core.config import RippleConfig
from rippleci.core.models import (
    FileNode,
    IndexSummary,
    SymbolKind,
    SymbolNode,
    TestCaseNode,
)
from rippleci.graph.store import GraphStore
from rippleci.indexer.ast_parser import ModuleParseResult, parse_python_file
from rippleci.indexer.coverage_parser import (
    map_coverage_to_symbols,
    parse_coverage_json,
)
from rippleci.indexer.pytest_collector import collect_tests_from_file


def _get_git_commit(repo_root: Path) -> Optional[str]:
    """Get current Git commit SHA if in a repository."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            check=False,
        )
        if res.returncode == 0:
            return res.stdout.strip()
    except Exception:
        pass
    return None


def _matches_any(path_str: str, patterns: List[str]) -> bool:
    """Simple glob matcher against a list of patterns."""
    for pat in patterns:
        cleaned = pat.replace("**/", "").replace("/**", "").rstrip("*")
        if cleaned and cleaned in path_str:
            return True
        if pat.endswith(".py") and path_str.endswith(".py"):
            return True
    return False


def _hash_file(file_path: Path) -> str:
    """Compute sha256 checksum of a file."""
    h = hashlib.sha256()
    try:
        h.update(file_path.read_bytes())
        return h.hexdigest()[:16]
    except Exception:
        return "empty"


class RepositoryIndexer:
    """Extracts code entities and populates a GraphStore."""

    def __init__(self, repo_root: Path, config: RippleConfig, graph_store: GraphStore):
        self.repo_root = repo_root
        self.config = config
        self.store = graph_store
        self.repo_id = config.repository.id

    def index(self, commit_sha: Optional[str] = None) -> IndexSummary:
        start_time = time.perf_counter()
        commit = commit_sha or _get_git_commit(self.repo_root)

        source_files, test_files = self._discover_files()
        all_parsed: Dict[str, ModuleParseResult] = {}
        all_symbols: Dict[str, SymbolNode] = {}  # qualified_name -> SymbolNode
        all_symbols_by_id: Dict[str, SymbolNode] = {}  # id -> SymbolNode
        qname_to_id: Dict[str, str] = {}
        warnings: List[str] = []

        # 1. Parse source and test Python files
        for fpath in source_files + test_files:
            content_hash = _hash_file(fpath)
            res = parse_python_file(fpath, self.repo_root, content_hash)
            all_parsed[res.file_path] = res
            warnings.extend(res.warnings)

            # Store FileNode
            file_id = f"{self.repo_id}:{res.file_path}"
            file_node = FileNode(
                id=file_id,
                repo_id=self.repo_id,
                path=res.file_path,
                language="python",
                content_hash=content_hash,
            )
            self.store.upsert_file(file_node)

            # Store SymbolNodes and DEFINES edges
            for s in res.symbols:
                sym_id = f"{self.repo_id}:{res.file_path}::{s.qualified_name}"
                sym_node = SymbolNode(
                    id=sym_id,
                    repo_id=self.repo_id,
                    name=s.name,
                    qualified_name=s.qualified_name,
                    kind=s.kind,
                    file_path=s.file_path,
                    start_line=s.start_line,
                    end_line=s.end_line,
                )
                self.store.upsert_symbol(sym_node)
                self.store.link_file_defines_symbol(file_id, sym_id)

                all_symbols[s.qualified_name] = sym_node
                all_symbols_by_id[sym_id] = sym_node
                qname_to_id[s.qualified_name] = sym_id

        # 2. Resolve and store CALLS relationships
        call_edges_count = 0
        unresolved_calls_count = 0

        for fpath, parsed in all_parsed.items():
            for call in parsed.calls:
                caller_qname = call.caller_qualified_name
                caller_id = qname_to_id.get(caller_qname)

                # Try resolving target
                target_id = None
                if call.callee_qualified_name in qname_to_id:
                    target_id = qname_to_id[call.callee_qualified_name]
                else:
                    # Search by callee name or suffix
                    for qn, sid in qname_to_id.items():
                        if qn.endswith(f".{call.callee_name}") or qn == call.callee_name:
                            target_id = sid
                            break

                if caller_id and target_id and caller_id != target_id:
                    self.store.link_symbol_calls(
                        caller_id=caller_id,
                        callee_id=target_id,
                        line=call.line,
                        source_kind="ast",
                    )
                    call_edges_count += 1
                else:
                    unresolved_calls_count += 1

            unresolved_calls_count += len(parsed.unresolved_calls)

        # 3. Collect TestCases and link COVERS relationships
        collected_test_nodes: List[TestCaseNode] = []
        coverage_edges_count = 0

        for tpath in test_files:
            tests = collect_tests_from_file(tpath, self.repo_root)
            for t in tests:
                test_id = f"{self.repo_id}:{t.node_id}"
                tc_node = TestCaseNode(
                    id=test_id,
                    repo_id=self.repo_id,
                    node_id=t.node_id,
                    name=t.name,
                    file_path=t.file_path,
                    framework=t.framework,
                )
                self.store.upsert_test_case(tc_node)
                collected_test_nodes.append(tc_node)

                # Link coverage from calls inside the test
                for called in t.called_symbols:
                    target_sym_id = None
                    if called in qname_to_id:
                        target_sym_id = qname_to_id[called]
                    else:
                        for qn, sid in qname_to_id.items():
                            if qn.endswith(f".{called}") or qn == called:
                                target_sym_id = sid
                                break
                    if target_sym_id:
                        self.store.link_test_covers_symbol(
                            test_id=test_id,
                            symbol_id=target_sym_id,
                            source_kind="ast_call",
                        )
                        coverage_edges_count += 1

                # Link coverage from naming heuristic (e.g. test_process_payment -> process_payment)
                target_base_name = t.name.replace("test_", "").replace("_test", "")
                for qn, sid in qname_to_id.items():
                    if qn.endswith(f".{target_base_name}") or qn == target_base_name:
                        self.store.link_test_covers_symbol(
                            test_id=test_id,
                            symbol_id=sid,
                            source_kind="ast_name_match",
                        )
                        coverage_edges_count += 1

        # 4. Check for coverage.json or .coverage file
        cov_json_path = self.repo_root / "coverage.json"
        if cov_json_path.exists():
            executed_map = parse_coverage_json(cov_json_path)
            cov_sym_ids = map_coverage_to_symbols(executed_map, list(all_symbols_by_id.values()))
            # Link all collected tests to these measured symbols
            for tnode in collected_test_nodes:
                for sid in cov_sym_ids:
                    self.store.link_test_covers_symbol(
                        test_id=tnode.id,
                        symbol_id=sid,
                        source_kind="coverage_py",
                    )
                    coverage_edges_count += 1

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return IndexSummary(
            repo_id=self.repo_id,
            commit_sha=commit,
            files_scanned=len(source_files) + len(test_files),
            symbols_count=len(all_symbols),
            test_cases_count=len(collected_test_nodes),
            call_edges_count=call_edges_count,
            coverage_edges_count=coverage_edges_count,
            unresolved_calls_count=unresolved_calls_count,
            warnings=warnings,
            duration_ms=round(elapsed_ms, 2),
            index_version="0.1.0",
        )

    def _discover_files(self) -> Tuple[List[Path], List[Path]]:
        """Find Python source and test files respecting exclude rules."""
        source_files: List[Path] = []
        test_files: List[Path] = []

        exclude_patterns = self.config.repository.exclude
        include_patterns = self.config.repository.include

        for root, dirs, files in os.walk(self.repo_root):
            # Prune excluded directories in-place
            dirs[:] = [
                d
                for d in dirs
                if not d.startswith(".")
                and d not in ("__pycache__", "node_modules", "dist", "build", "site-packages")
                and not _matches_any(
                    str(Path(root, d).relative_to(self.repo_root)).replace("\\", "/"),
                    exclude_patterns,
                )
            ]

            for f in files:
                if not f.endswith(".py"):
                    continue

                full_path = Path(root, f)
                rel_path = str(full_path.relative_to(self.repo_root)).replace("\\", "/")

                if _matches_any(rel_path, exclude_patterns):
                    continue

                # Classify as test or source
                if "tests/" in rel_path or f.startswith("test_") or f.endswith("_test.py"):
                    test_files.append(full_path)
                else:
                    source_files.append(full_path)

        return source_files, test_files

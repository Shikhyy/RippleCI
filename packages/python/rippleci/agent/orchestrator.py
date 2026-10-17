"""Investigation orchestrator coordinating graph tools and evidence explanations."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from rippleci.agent.tools import (
    AgentToolRegistry,
    AnalyzeChangeInput,
    CheckGapsInput,
    RankTestCandidatesInput,
    RetrieveTestCandidatesInput,
    TraceImpactInput,
)
from rippleci.core.config import RippleConfig
from rippleci.core.models import ImpactReport, TestPlan
from rippleci.graph.store import GraphStore


@dataclass
class TestExplanation:
    test_id: str
    test_name: str
    rank: int
    rank_score: float
    reasons: List[str]
    evidence_paths: List[str]
    is_direct: bool
    summary: str


@dataclass
class InvestigationResult:
    base_ref: str
    head_ref: str
    changed_symbols_count: int
    impacted_callers_count: int
    candidate_tests_count: int
    selected_tests_count: int
    estimated_duration_seconds: float
    verdict: str
    evidence_summary: str
    tool_trace: List[str] = field(default_factory=list)


class InvestigationOrchestrator:
    """Orchestrates deterministic graph tools to analyze changes and generate evidence explanations."""

    def __init__(self, repo_root: Path, config: RippleConfig, graph_store: GraphStore):
        self.repo_root = repo_root
        self.config = config
        self.store = graph_store
        self.tools = AgentToolRegistry(repo_root, config, graph_store)

    def investigate_change(
        self,
        base_ref: str = "origin/main",
        head_ref: str = "HEAD",
        budget_seconds: float = 300.0,
        file_diffs: Optional[List[Dict[str, Any]]] = None,
    ) -> InvestigationResult:
        trace: List[str] = []

        # Step 1: Tool call - analyze_change
        change_info = self.tools.analyze_change(
            AnalyzeChangeInput(base_ref=base_ref, head_ref=head_ref, file_diffs=file_diffs)
        )
        trace.append(f"tool:analyze_change -> {change_info['changed_symbols_count']} modified symbols")

        changed_ids = [s["id"] for s in change_info["changed_symbols"]]

        # Step 2: Tool call - trace_impact
        impact_info = self.tools.trace_impact(TraceImpactInput(symbol_ids=changed_ids, max_depth=5))
        trace.append(f"tool:trace_impact -> {impact_info['impacted_callers_count']} downstream callers found")

        # Step 3: Tool call - retrieve_test_candidates
        all_impacted_ids = list(set(changed_ids + [c["caller_id"] for c in impact_info["callers"]]))
        test_info = self.tools.retrieve_test_candidates(
            RetrieveTestCandidatesInput(impacted_symbol_ids=all_impacted_ids)
        )
        trace.append(f"tool:retrieve_test_candidates -> {test_info['candidate_tests_count']} tests mapped")

        # Step 4: Tool call - rank_test_candidates
        plan_info = self.tools.rank_test_candidates(
            RankTestCandidatesInput(budget_seconds=budget_seconds)
        )
        trace.append(
            f"tool:rank_test_candidates -> {plan_info['selected_tests_count']} tests selected ({plan_info['estimated_total_seconds']}s)"
        )

        # Step 5: Tool call - check_verification_gaps
        test_ids = [t["test_id"] for t in plan_info["selected_tests"]]
        gap_info = self.tools.check_verification_gaps(
            CheckGapsInput(changed_symbol_ids=changed_ids, candidate_test_ids=test_ids)
        )
        trace.append(f"tool:check_verification_gaps -> {gap_info['recommendation']}")

        # Formulate grounded explanation
        evidence_lines = [
            f"### RippleCI Investigation Findings",
            f"",
            f"1. **Blast Radius Analysis:**",
            f"   - Change range `{base_ref}..{head_ref}` directly modified `{len(changed_ids)}` symbol(s).",
            f"   - Multi-hop traversal in FalkorDB uncovered `{impact_info['impacted_callers_count']}` downstream caller(s).",
        ]

        if impact_info["callers"]:
            evidence_lines.append("   - Key caller paths:")
            for c in impact_info["callers"][:5]:
                path_str = " → ".join(c.get("path_names", [c["caller_name"]]))
                evidence_lines.append(f"     * `{c['caller_name']}` ({c['hops']} hops): `{path_str}`")

        evidence_lines.extend([
            f"",
            f"2. **Test Selection & Prioritization:**",
            f"   - Selected `{plan_info['selected_tests_count']}` tests within `{budget_seconds:.0f}s` budget using `{plan_info['ranker']}`.",
            f"   - Total estimated execution time: `{plan_info['estimated_total_seconds']:.1f}s`.",
            f"",
            f"3. **Coverage & Blind Spot Verification:**",
            f"   - Verification status: `{gap_info['recommendation'].upper()}`.",
        ])

        if gap_info["gaps_detected"]:
            evidence_lines.append(
                f"   - ⚠️ Missing direct test coverage for {gap_info['uncovered_symbols_count']} changed symbol(s). Recommend full-suite verification."
            )
        else:
            evidence_lines.append(
                "   - ✓ All modified symbols have verified test coverage in the dependency graph."
            )

        verdict = "VERIFIED_SAFE" if not gap_info["gaps_detected"] else "REVIEW_RECOMMENDED"

        return InvestigationResult(
            base_ref=base_ref,
            head_ref=head_ref,
            changed_symbols_count=len(changed_ids),
            impacted_callers_count=impact_info["impacted_callers_count"],
            candidate_tests_count=test_info["candidate_tests_count"],
            selected_tests_count=plan_info["selected_tests_count"],
            estimated_duration_seconds=plan_info["estimated_total_seconds"],
            verdict=verdict,
            evidence_summary="\n".join(evidence_lines),
            tool_trace=trace,
        )

    def explain_test(self, test_name_or_id: str, plan: TestPlan) -> Optional[TestExplanation]:
        """Explain why a specific test was selected using graph paths and model features."""
        for test in plan.selected_tests:
            if test_name_or_id in test.name or test_name_or_id in test.node_id or test_name_or_id in test.test_id:
                is_direct = any("direct" in r.lower() for r in test.reasons)
                summary = (
                    f"Test '{test.name}' ranked #{test.rank} (score: {test.rank_score:.2f}) "
                    f"because it {'directly covers' if is_direct else 'indirectly covers callers of'} "
                    f"the modified symbols. Reasons: {', '.join(test.reasons)}."
                )
                return TestExplanation(
                    test_id=test.test_id,
                    test_name=test.name,
                    rank=test.rank,
                    rank_score=test.rank_score,
                    reasons=test.reasons,
                    evidence_paths=test.evidence_path_ids,
                    is_direct=is_direct,
                    summary=summary,
                )
        return None

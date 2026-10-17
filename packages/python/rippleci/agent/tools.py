"""Predefined, validated tools for the RippleCI Graph Reasoning Agent."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from rippleci.core.config import RippleConfig
from rippleci.core.models import (
    CandidateTest,
    ImpactReport,
    IndexSummary,
    SelectedTest,
    TestPlan,
)
from rippleci.graph.store import GraphStore
from rippleci.impact.analyzer import ImpactAnalyzer
from rippleci.impact.diff import FileDiff
from rippleci.ranking.planner import TestPlanner


class AnalyzeChangeInput(BaseModel):
    base_ref: str = Field(default="origin/main", description="Git base revision e.g. origin/main")
    head_ref: str = Field(default="HEAD", description="Git head revision e.g. HEAD")
    file_diffs: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Optional explicit file diffs for testing"
    )


class TraceImpactInput(BaseModel):
    symbol_ids: List[str] = Field(description="List of symbol IDs to trace downstream callers for")
    max_depth: int = Field(default=5, description="Maximum call depth to traverse in graph")


class RetrieveTestCandidatesInput(BaseModel):
    impacted_symbol_ids: List[str] = Field(description="Impacted symbol IDs to discover candidate tests for")


class RankTestCandidatesInput(BaseModel):
    budget_seconds: float = Field(default=300.0, description="Test execution time budget in seconds")


class CheckGapsInput(BaseModel):
    changed_symbol_ids: List[str] = Field(description="Modified symbol IDs")
    candidate_test_ids: List[str] = Field(description="Discovered candidate test IDs")


class AgentToolRegistry:
    """Provides validated tool execution bound to the repository's GraphStore and services."""

    def __init__(self, repo_root, config: RippleConfig, graph_store: GraphStore):
        self.repo_root = repo_root
        self.config = config
        self.store = graph_store
        self.analyzer = ImpactAnalyzer(self.repo_root, self.config, self.store)
        self.planner = TestPlanner(self.config)
        self._last_impact: Optional[ImpactReport] = None

    def analyze_change(self, args: AnalyzeChangeInput) -> Dict[str, Any]:
        """Tool: Resolve git diff and identify modified files and symbols."""
        diffs = [FileDiff(**d) for d in args.file_diffs] if args.file_diffs else None
        impact = self.analyzer.analyze(base=args.base_ref, head=args.head_ref, file_diffs=diffs)
        self._last_impact = impact
        return {
            "run_id": impact.run_id,
            "base_ref": impact.base_ref,
            "head_ref": impact.head_ref,
            "changed_files_count": len(impact.changed_files),
            "changed_files": impact.changed_files,
            "changed_symbols_count": len(impact.changed_symbols),
            "changed_symbols": [
                {
                    "id": s.id,
                    "name": s.name,
                    "qualified_name": s.qualified_name,
                    "file_path": s.file_path,
                    "lines": f"{s.start_line}-{s.end_line}",
                }
                for s in impact.changed_symbols
            ],
            "warnings": impact.warnings,
        }

    def trace_impact(self, args: TraceImpactInput) -> Dict[str, Any]:
        """Tool: Traverse graph along CALLS edges to locate downstream callers."""
        callers = self.store.get_callers_of_symbols(args.symbol_ids, max_depth=args.max_depth)
        return {
            "symbol_ids_queried": args.symbol_ids,
            "impacted_callers_count": len(callers),
            "callers": callers,
        }

    def retrieve_test_candidates(self, args: RetrieveTestCandidatesInput) -> Dict[str, Any]:
        """Tool: Find tests covering any of the impacted symbols."""
        tests = self.store.get_candidate_tests(args.impacted_symbol_ids)
        return {
            "impacted_symbols_queried": len(args.impacted_symbol_ids),
            "candidate_tests_count": len(tests),
            "candidate_tests": tests,
        }

    def rank_test_candidates(self, args: RankTestCandidatesInput) -> Dict[str, Any]:
        """Tool: Prioritize tests under a runtime budget using graph features and ML."""
        if not self._last_impact:
            self._last_impact = self.analyzer.analyze(base="origin/main", head="HEAD")

        plan = self.planner.plan(self._last_impact, budget_seconds=args.budget_seconds)
        return {
            "plan_id": plan.plan_id,
            "budget_seconds": plan.budget_seconds,
            "estimated_total_seconds": plan.estimated_total_seconds,
            "ranker": plan.ranker_type,
            "selected_tests_count": len(plan.selected_tests),
            "selected_tests": [
                {
                    "rank": t.rank,
                    "test_id": t.test_id,
                    "name": t.name,
                    "score": t.rank_score,
                    "reasons": t.reasons,
                    "duration_s": t.estimated_duration_seconds,
                }
                for t in plan.selected_tests
            ],
            "omitted_tests_count": plan.deselected_tests_count,
            "fallback": plan.fallback_recommendation,
        }

    def check_verification_gaps(self, args: CheckGapsInput) -> Dict[str, Any]:
        """Tool: Inspect test candidate coverage against changed symbols to identify gaps."""
        uncovered = [
            sid
            for sid in args.changed_symbol_ids
            if not any(sid in tid for tid in args.candidate_test_ids)
        ]
        gaps_detected = len(uncovered) > 0
        return {
            "gaps_detected": gaps_detected,
            "uncovered_symbols_count": len(uncovered),
            "uncovered_symbol_ids": uncovered,
            "recommendation": "expand_suite" if gaps_detected else "coverage_sufficient",
        }

"""Unit tests for the RippleCI Graph Reasoning Agent & Tools."""

from pathlib import Path
import pytest

from rippleci import RippleProject
from rippleci.agent.tools import (
    AnalyzeChangeInput,
    CheckGapsInput,
    RankTestCandidatesInput,
    RetrieveTestCandidatesInput,
    TraceImpactInput,
)
from rippleci.impact.diff import FileDiff


@pytest.fixture
def sample_repo_path() -> Path:
    return Path(__file__).parent.parent.parent / "examples" / "sample-repository"


def test_agent_tools_execution(sample_repo_path: Path):
    project = RippleProject.open(sample_repo_path, force_memory_graph=True)
    project.indexer.index()

    tools = project.agent.tools

    # 1. analyze_change tool
    diff_data = [{"file_path": "src/auth.py", "modified_lines": [12]}]
    change_res = tools.analyze_change(AnalyzeChangeInput(file_diffs=diff_data))
    assert change_res["changed_files_count"] == 1
    assert len(change_res["changed_symbols"]) >= 1

    changed_id = change_res["changed_symbols"][0]["id"]

    # 2. trace_impact tool
    trace_res = tools.trace_impact(TraceImpactInput(symbol_ids=[changed_id], max_depth=3))
    assert "impacted_callers_count" in trace_res
    assert isinstance(trace_res["callers"], list)

    # 3. retrieve_test_candidates tool
    candidate_res = tools.retrieve_test_candidates(
        RetrieveTestCandidatesInput(impacted_symbol_ids=[changed_id])
    )
    assert candidate_res["candidate_tests_count"] >= 1

    # 4. rank_test_candidates tool
    rank_res = tools.rank_test_candidates(RankTestCandidatesInput(budget_seconds=120.0))
    assert rank_res["selected_tests_count"] >= 1
    assert "selected_tests" in rank_res

    # 5. check_verification_gaps tool
    test_ids = [t["test_id"] for t in rank_res["selected_tests"]]
    gap_res = tools.check_verification_gaps(
        CheckGapsInput(changed_symbol_ids=[changed_id], candidate_test_ids=test_ids)
    )
    assert "gaps_detected" in gap_res
    assert gap_res["recommendation"] in ["expand_suite", "coverage_sufficient"]


def test_investigation_orchestrator(sample_repo_path: Path):
    project = RippleProject.open(sample_repo_path, force_memory_graph=True)
    project.indexer.index()

    diffs = [{"file_path": "src/payments.py", "modified_lines": [15]}]
    result = project.agent.investigate_change(
        base_ref="HEAD~1",
        head_ref="HEAD",
        budget_seconds=180.0,
        file_diffs=diffs,
    )

    assert result.changed_symbols_count >= 1
    assert len(result.tool_trace) == 5
    assert result.verdict in ["VERIFIED_SAFE", "REVIEW_RECOMMENDED"]
    assert "RippleCI Investigation Findings" in result.evidence_summary
    assert "Blast Radius Analysis" in result.evidence_summary


def test_explain_test(sample_repo_path: Path):
    project = RippleProject.open(sample_repo_path, force_memory_graph=True)
    project.indexer.index()

    diffs = [FileDiff(file_path="src/auth.py", modified_lines=[12])]
    impact = project.analyzer.analyze(file_diffs=diffs)
    plan = project.planner.plan(impact=impact, budget_seconds=300.0)

    # Pick first test
    first_test = plan.selected_tests[0]
    explanation = project.agent.explain_test(first_test.name, plan)

    assert explanation is not None
    assert explanation.test_name == first_test.name
    assert explanation.rank == first_test.rank
    assert explanation.rank_score == first_test.rank_score
    assert len(explanation.reasons) >= 1
    assert "because it" in explanation.summary

    # Test not in plan
    not_found = project.agent.explain_test("non_existent_test_12345", plan)
    assert not_found is None

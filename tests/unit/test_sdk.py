"""Unit tests for the RippleCI Python SDK."""

from pathlib import Path
import pytest
from rippleci import RippleProject
from rippleci.impact.diff import FileDiff


@pytest.fixture
def sample_repo_path() -> Path:
    return Path(__file__).parent.parent.parent / "examples" / "sample-repository"


def test_sdk_end_to_end_workflow(sample_repo_path: Path):
    project = RippleProject.open(sample_repo_path, force_memory_graph=True)

    # 1. Index
    summary = project.indexer.index()
    assert summary.symbols_count >= 8
    assert summary.test_cases_count >= 10

    # 2. Impact
    diffs = [FileDiff(file_path="src/auth.py", modified_lines=[12])]
    impact = project.analyzer.analyze(file_diffs=diffs)
    assert len(impact.changed_symbols) >= 1
    assert len(impact.candidate_tests) >= 2

    # 3. Plan
    plan = project.planner.plan(impact=impact, budget_seconds=300.0)
    assert len(plan.selected_tests) >= 2

    # 4. Verify
    verification = project.verifier.verify(plan=plan, target_files=["src/auth.py"], max_mutations=2)
    assert verification.all_passed is True

    # 5. Report
    report = project.reporter.build(impact=impact, plan=plan, verification=verification)
    assert report.repo_id == "sample-repository"
    assert "RippleCI Release Intelligence Report" in report.summary

    # Formats
    md_output = project.reporter.to_markdown(report)
    assert "# RippleCI Release Intelligence Report" in md_output
    assert "## Change Impact Blast Radius" in md_output

    json_output = project.reporter.to_json(report)
    assert '"repo_id": "sample-repository"' in json_output


def test_sdk_convenience_methods(sample_repo_path: Path):
    project = RippleProject.open(sample_repo_path, force_memory_graph=True)
    project.indexer.index()

    # Test graph retrieval
    graph_data = project.get_graph()
    assert len(graph_data.nodes) > 0
    assert len(graph_data.edges) > 0

    # Test graph stats
    stats = project.get_stats()
    assert stats["symbols"] >= 8
    assert stats["test_cases"] >= 10

    # Test top-level imports
    from rippleci import (
        FileDiff,
        ImpactReport,
        RippleConfig,
        RippleError,
        RippleReport,
        TestPlan,
        VerificationReport,
    )
    assert RippleProject is not None
    assert RippleConfig is not None
    assert RippleError is not None


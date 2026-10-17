"""Evaluation tests executing reproducible benchmark comparisons across strategies."""

from pathlib import Path
import pytest
from rippleci.ranking.evaluation import run_benchmark_evaluation


@pytest.fixture
def sample_repo_path() -> Path:
    return Path(__file__).parent.parent.parent / "examples" / "sample-repository"


def test_benchmark_strategy_comparisons(sample_repo_path: Path, tmp_path: Path):
    benchmark_out = tmp_path / "benchmark-results.json"
    results = run_benchmark_evaluation(sample_repo_path, output_path=benchmark_out)

    assert results.total_scenarios == 3
    assert benchmark_out.exists()

    strategies = results.strategies
    assert "full_suite" in strategies
    assert "change_file_heuristic" in strategies
    assert "graph_only" in strategies
    assert "graph_plus_ml" in strategies

    # Full suite selects all tests (100% selection ratio, 100% recall)
    assert strategies["full_suite"].fault_recall == 1.0
    assert strategies["full_suite"].selection_ratio == 1.0

    # Graph-only and Graph+ML select a fraction of the suite while detecting downstream faults
    assert strategies["graph_only"].selection_ratio < strategies["full_suite"].selection_ratio
    assert strategies["graph_plus_ml"].selection_ratio < strategies["full_suite"].selection_ratio

    # File-heuristic misses downstream indirect regressions (e.g. process_payment when auth changes)
    assert strategies["change_file_heuristic"].fault_recall <= strategies["graph_only"].fault_recall

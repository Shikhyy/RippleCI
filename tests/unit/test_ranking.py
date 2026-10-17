"""Unit tests for feature extraction, ranking models, and test planner."""

from pathlib import Path
import pytest
from rippleci.core.config import RippleConfig
from rippleci.core.models import (
    CandidateTest,
    ImpactReport,
    SymbolKind,
    SymbolNode,
    TestCaseNode,
)
from rippleci.graph.memory_store import MemoryGraphStore
from rippleci.impact.analyzer import ImpactAnalyzer
from rippleci.impact.diff import FileDiff
from rippleci.indexer.pipeline import RepositoryIndexer
from rippleci.ranking.features import extract_all_features, extract_features_for_candidate
from rippleci.ranking.planner import TestPlanner
from rippleci.ranking.rankers import HeuristicRanker, MLRanker


@pytest.fixture
def sample_repo_path() -> Path:
    return Path(__file__).parent.parent.parent / "examples" / "sample-repository"


@pytest.fixture
def impact_fixture(sample_repo_path: Path) -> ImpactReport:
    store = MemoryGraphStore()
    config = RippleConfig()
    config.repository.id = "sample-python-service"
    indexer = RepositoryIndexer(sample_repo_path, config, store)
    indexer.index()

    analyzer = ImpactAnalyzer(sample_repo_path, config, store)
    diffs = [FileDiff(file_path="src/auth.py", modified_lines=[12])]
    return analyzer.analyze(file_diffs=diffs)


def test_feature_extraction(impact_fixture: ImpactReport):
    vectors = extract_all_features(impact_fixture)
    assert len(vectors) == len(impact_fixture.candidate_tests)
    for vec in vectors:
        assert "direct_coverage" in vec.feature_dict
        assert "graph_proximity" in vec.feature_dict
        assert vec.feature_array.shape == (6,)


def test_heuristic_ranker_ordering(impact_fixture: ImpactReport):
    ranker = HeuristicRanker()
    vectors = extract_all_features(impact_fixture)
    scores = ranker.score(vectors)
    assert len(scores) == len(vectors)
    for score in scores:
        assert 0.0 <= score <= 1.0

    # Direct coverage test must score higher than indirect test
    direct_vec = next(v for v in vectors if v.feature_dict["direct_coverage"] == 1.0)
    indirect_vec = next(v for v in vectors if v.feature_dict["direct_coverage"] == 0.0)
    score_direct = ranker.score([direct_vec])[0]
    score_indirect = ranker.score([indirect_vec])[0]
    assert score_direct > score_indirect


def test_ml_ranker_predictions(impact_fixture: ImpactReport):
    ranker = MLRanker()
    vectors = extract_all_features(impact_fixture)
    scores = ranker.score(vectors)
    assert len(scores) == len(vectors)
    for score in scores:
        assert 0.0 <= score <= 1.0


def test_test_planner_budget_constraint(impact_fixture: ImpactReport):
    planner = TestPlanner()
    # Very small budget (e.g. 2.0s when each test is ~1.2s) should select at least 1 test and deselect others
    plan = planner.plan(impact_fixture, budget_seconds=2.0)
    assert len(plan.selected_tests) >= 1
    assert plan.deselected_tests_count > 0
    assert plan.estimated_total_seconds <= 2.5
    assert plan.fallback_recommendation is not None

"""Unit tests for verification engine, test runner, and mutation analysis."""

from pathlib import Path
import pytest
from rippleci.core.config import RippleConfig
from rippleci.core.models import SelectedTest, TestPlan
from rippleci.graph.memory_store import MemoryGraphStore
from rippleci.verification.test_runner import SafeTestRunner
from rippleci.verification.verifier import VerificationEngine


@pytest.fixture
def sample_repo_path() -> Path:
    return Path(__file__).parent.parent.parent / "examples" / "sample-repository"


def test_safe_test_runner(sample_repo_path: Path):
    runner = SafeTestRunner(sample_repo_path)
    node_ids = ["tests/test_auth.py::test_verify_valid_token"]
    results = runner.run_tests(node_ids)

    assert len(results) == 1
    assert results[0].node_id == "tests/test_auth.py::test_verify_valid_token"
    assert results[0].status == "passed"
    assert results[0].duration_seconds > 0.0


def test_verification_engine_with_mutations(sample_repo_path: Path):
    config = RippleConfig()
    config.repository.id = "sample-python-service"
    config.testing.allow_execution = True
    config.testing.allow_mutation_testing = True
    config.testing.max_mutations = 2

    store = MemoryGraphStore()
    engine = VerificationEngine(sample_repo_path, config, store)

    plan = TestPlan(
        plan_id="plan_test_123",
        run_id="run_test_123",
        repo_id=config.repository.id,
        budget_seconds=300.0,
        estimated_total_seconds=2.0,
        ranker_type="HeuristicRanker",
        ranker_version="1.0",
        selected_tests=[
            SelectedTest(
                test_id=f"{config.repository.id}:tests/test_auth.py::test_verify_valid_token",
                node_id="tests/test_auth.py::test_verify_valid_token",
                name="test_verify_valid_token",
                file_path="tests/test_auth.py",
                rank=1,
                rank_score=0.95,
                reasons=["direct_coverage"],
                estimated_duration_seconds=1.0,
            ),
            SelectedTest(
                test_id=f"{config.repository.id}:tests/test_auth.py::test_verify_expired_token",
                node_id="tests/test_auth.py::test_verify_expired_token",
                name="test_verify_expired_token",
                file_path="tests/test_auth.py",
                rank=2,
                rank_score=0.90,
                reasons=["direct_coverage"],
                estimated_duration_seconds=1.0,
            ),
        ],
        created_at="2026-10-17T00:00:00Z",
    )

    report = engine.verify(plan=plan, target_files=["src/auth.py"], max_mutations=2)

    assert report.tests_executed_count == 2
    assert report.all_passed is True
    assert report.mutations_tested_count >= 1
    # Check that at least one mutant was killed by the test suite
    assert report.killed_mutations_count >= 1
    assert report.recommendation in ("release_safe", "review_required")

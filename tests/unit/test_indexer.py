"""Unit and integration tests for repository indexing and graph persistence."""

from pathlib import Path
import pytest
from rippleci.core.config import RippleConfig
from rippleci.graph.memory_store import MemoryGraphStore
from rippleci.indexer.pipeline import RepositoryIndexer


@pytest.fixture
def sample_repo_path() -> Path:
    return Path(__file__).parent.parent.parent / "examples" / "sample-repository"


@pytest.fixture
def graph_store() -> MemoryGraphStore:
    return MemoryGraphStore()


def test_index_sample_repository(sample_repo_path: Path, graph_store: MemoryGraphStore):
    config = RippleConfig()
    config.repository.id = "sample-python-service"

    indexer = RepositoryIndexer(
        repo_root=sample_repo_path,
        config=config,
        graph_store=graph_store,
    )

    summary = indexer.index()

    # Verify summary counts
    assert summary.repo_id == "sample-python-service"
    assert summary.files_scanned >= 4
    assert summary.symbols_count >= 8
    assert summary.test_cases_count >= 10
    assert summary.call_edges_count >= 3
    assert summary.coverage_edges_count >= 8

    # Check store counts
    counts = graph_store.get_graph_counts()
    assert counts["symbols"] >= 8
    assert counts["test_cases"] >= 10
    assert counts["calls"] >= 3

    # Check that verify_token symbol exists
    sym_ids = [
        sid for sid, sym in graph_store.symbols.items() if sym.name == "verify_token"
    ]
    assert len(sym_ids) == 1
    verify_token_id = sym_ids[0]

    # Check callers of verify_token: process_payment should call it (hop 1), place_order should call process_payment (hop 2)
    callers = graph_store.get_callers_of_symbols([verify_token_id], max_depth=5)
    caller_names = [c["caller_name"] for c in callers]
    assert "process_payment" in caller_names
    assert "place_order" in caller_names

    # Check candidate tests
    candidate_tests = graph_store.get_candidate_tests([verify_token_id])
    assert len(candidate_tests) >= 1
    test_names = [t["test_name"] for t in candidate_tests]
    assert any("verify" in name for name in test_names)


def test_indexing_idempotence(sample_repo_path: Path, graph_store: MemoryGraphStore):
    """Re-indexing must not duplicate nodes or edges."""
    config = RippleConfig()
    config.repository.id = "sample-python-service"

    indexer = RepositoryIndexer(
        repo_root=sample_repo_path,
        config=config,
        graph_store=graph_store,
    )

    # First run
    summary1 = indexer.index()
    counts1 = graph_store.get_graph_counts()

    # Second run without clearing
    summary2 = indexer.index()
    counts2 = graph_store.get_graph_counts()

    assert summary1.symbols_count == summary2.symbols_count
    assert summary1.test_cases_count == summary2.test_cases_count
    assert counts1["symbols"] == counts2["symbols"]
    assert counts1["test_cases"] == counts2["test_cases"]

"""Unit and integration tests for change impact analysis."""

from pathlib import Path
import pytest
from rippleci.core.config import RippleConfig
from rippleci.graph.memory_store import MemoryGraphStore
from rippleci.impact.analyzer import ImpactAnalyzer
from rippleci.impact.diff import FileDiff, parse_unified_diff
from rippleci.indexer.pipeline import RepositoryIndexer


@pytest.fixture
def sample_repo_path() -> Path:
    return Path(__file__).parent.parent.parent / "examples" / "sample-repository"


@pytest.fixture
def indexed_store(sample_repo_path: Path) -> MemoryGraphStore:
    store = MemoryGraphStore()
    config = RippleConfig()
    config.repository.id = "sample-python-service"
    indexer = RepositoryIndexer(sample_repo_path, config, store)
    indexer.index()
    return store


def test_impact_analysis_on_changed_function(sample_repo_path: Path, indexed_store: MemoryGraphStore):
    """Changing verify_token must trace impact to process_payment and place_order."""
    config = RippleConfig()
    config.repository.id = "sample-python-service"
    analyzer = ImpactAnalyzer(sample_repo_path, config, indexed_store)

    # Simulate diff touching verify_token (src/auth.py lines 10-15)
    file_diffs = [
        FileDiff(
            file_path="src/auth.py",
            modified_lines=[11, 12],
            added_lines=[12],
        )
    ]

    report = analyzer.analyze(file_diffs=file_diffs)

    assert len(report.changed_symbols) >= 1
    changed_names = [s.name for s in report.changed_symbols]
    assert "verify_token" in changed_names

    # Check impacted downstream symbols
    impacted_names = [imp.symbol.name for imp in report.impacted_symbols]
    assert "process_payment" in impacted_names
    assert "place_order" in impacted_names

    # Check hops
    pm_imp = next(imp for imp in report.impacted_symbols if imp.symbol.name == "process_payment")
    assert pm_imp.hops_from_change == 1

    po_imp = next(imp for imp in report.impacted_symbols if imp.symbol.name == "place_order")
    assert po_imp.hops_from_change == 2

    # Check candidate tests
    assert len(report.candidate_tests) >= 2
    test_node_ids = [t.test_case.node_id for t in report.candidate_tests]
    assert any("test_verify" in tid for tid in test_node_ids)

    # Check evidence paths
    assert len(report.evidence_paths) >= 2
    for ep in report.evidence_paths:
        assert 1 <= ep.hops <= 5
        assert len(ep.node_names) >= 2


def test_impact_analysis_unrelated_change(sample_repo_path: Path, indexed_store: MemoryGraphStore):
    """Changing send_security_alert must NOT impact payments or auth."""
    config = RippleConfig()
    config.repository.id = "sample-python-service"
    analyzer = ImpactAnalyzer(sample_repo_path, config, indexed_store)

    # Simulate diff in notifications.py (line 12: send_security_alert)
    file_diffs = [
        FileDiff(
            file_path="src/notifications.py",
            modified_lines=[12],
        )
    ]

    report = analyzer.analyze(file_diffs=file_diffs)

    changed_names = [s.name for s in report.changed_symbols]
    assert "send_security_alert" in changed_names

    impacted_names = [imp.symbol.name for imp in report.impacted_symbols]
    assert "process_payment" not in impacted_names
    assert "verify_token" not in impacted_names


def test_impact_analysis_non_python_change(sample_repo_path: Path, indexed_store: MemoryGraphStore):
    """Non-python file changes must produce appropriate warnings without crashes."""
    config = RippleConfig()
    config.repository.id = "sample-python-service"
    analyzer = ImpactAnalyzer(sample_repo_path, config, indexed_store)

    file_diffs = [
        FileDiff(
            file_path="README.md",
            modified_lines=[1, 2],
        )
    ]

    report = analyzer.analyze(file_diffs=file_diffs)
    assert len(report.changed_symbols) == 0
    assert any("Non-Python file changed" in w for w in report.warnings)


def test_unified_diff_parser():
    """Verify parsing unified git diff hunks."""
    sample_diff = """diff --git a/src/auth.py b/src/auth.py
index e69de29..d95f3ad 100644
--- a/src/auth.py
+++ b/src/auth.py
@@ -10,2 +10,3 @@ def verify_token(token: str) -> bool:
+    # Extra check
     if not token:
"""
    diffs = parse_unified_diff(sample_diff)
    assert len(diffs) == 1
    assert diffs[0].file_path == "src/auth.py"
    assert 10 in diffs[0].modified_lines

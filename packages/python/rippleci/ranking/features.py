"""Feature extraction for test ranking models."""

from dataclasses import dataclass
from typing import Any, Dict, List
import numpy as np

from rippleci.core.models import CandidateTest, ImpactReport


FEATURE_SCHEMA_VERSION = 1

FEATURE_NAMES = [
    "direct_coverage",
    "graph_proximity",
    "impacted_symbols_covered",
    "coverage_ratio",
    "history_failure_rate",
    "estimated_duration_s",
]


@dataclass
class TestFeatureVector:
    test_id: str
    feature_dict: Dict[str, float]
    feature_array: np.ndarray


def extract_features_for_candidate(
    candidate: CandidateTest,
    impact_report: ImpactReport,
) -> TestFeatureVector:
    """Extract tabular features from graph impact evidence for a single test."""
    total_impacted = max(1, len(impact_report.impacted_symbols) + len(impact_report.changed_symbols))
    covered_impacted = len(candidate.evidence_symbols)

    direct_cov = 1.0 if candidate.direct_coverage else 0.0
    graph_proximity = 1.0 / max(1, candidate.shortest_hops)
    coverage_ratio = float(covered_impacted) / float(total_impacted)

    fail_rate = 0.0
    if candidate.history_runs_count > 0:
        fail_rate = float(candidate.history_failures_count) / float(candidate.history_runs_count)

    feat_dict = {
        "direct_coverage": direct_cov,
        "graph_proximity": round(graph_proximity, 4),
        "impacted_symbols_covered": float(covered_impacted),
        "coverage_ratio": round(coverage_ratio, 4),
        "history_failure_rate": round(fail_rate, 4),
        "estimated_duration_s": float(candidate.estimated_duration_seconds),
    }

    feat_array = np.array([feat_dict[k] for k in FEATURE_NAMES], dtype=np.float32)

    return TestFeatureVector(
        test_id=candidate.test_case.id,
        feature_dict=feat_dict,
        feature_array=feat_array,
    )


def extract_all_features(
    impact_report: ImpactReport,
) -> List[TestFeatureVector]:
    """Extract features for all candidate tests in an impact report."""
    return [
        extract_features_for_candidate(cand, impact_report)
        for cand in impact_report.candidate_tests
    ]

"""Rankers for test prioritization: deterministic heuristic and supervised ML."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier

from rippleci.ranking.features import FEATURE_NAMES, TestFeatureVector


class Ranker(ABC):
    """Abstract base class for test rankers."""

    @abstractmethod
    def score(self, feature_vectors: List[TestFeatureVector]) -> List[float]:
        """Compute ranking score for each feature vector (higher is more relevant)."""
        pass

    @abstractmethod
    def explain(self, vector: TestFeatureVector) -> List[str]:
        """Generate human-readable explanations for a test's score."""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        pass


class HeuristicRanker(Ranker):
    """Deterministic, graph-grounded baseline ranker."""

    WEIGHTS = {
        "direct_coverage": 0.50,
        "graph_proximity": 0.25,
        "coverage_ratio": 0.15,
        "history_failure_rate": 0.10,
    }

    @property
    def version(self) -> str:
        return "heuristic-v1.0"

    def score(self, feature_vectors: List[TestFeatureVector]) -> List[float]:
        scores = []
        for vec in feature_vectors:
            fd = vec.feature_dict
            s = (
                self.WEIGHTS["direct_coverage"] * fd["direct_coverage"]
                + self.WEIGHTS["graph_proximity"] * fd["graph_proximity"]
                + self.WEIGHTS["coverage_ratio"] * fd["coverage_ratio"]
                + self.WEIGHTS["history_failure_rate"] * fd["history_failure_rate"]
            )
            # Duration penalty: small tie-breaker favoring faster tests
            duration_factor = 1.0 / (1.0 + 0.05 * fd.get("estimated_duration_s", 1.0))
            final_score = round(s * duration_factor, 4)
            scores.append(min(1.0, max(0.0, final_score)))
        return scores

    def explain(self, vector: TestFeatureVector) -> List[str]:
        reasons = []
        fd = vector.feature_dict
        if fd["direct_coverage"] > 0:
            reasons.append("Directly covers modified symbol")
        if fd["graph_proximity"] >= 1.0:
            reasons.append("Immediate graph neighbor (1 hop)")
        elif fd["graph_proximity"] >= 0.5:
            reasons.append("Downstream dependency caller (2 hops)")
        elif fd["graph_proximity"] > 0:
            reasons.append(f"Transitive caller ({int(round(1.0 / fd['graph_proximity']))} hops)")

        covered_count = int(fd["impacted_symbols_covered"])
        if covered_count > 1:
            reasons.append(f"Covers {covered_count} impacted symbols in call graph")

        if fd["history_failure_rate"] > 0:
            reasons.append(f"Historical failure rate: {fd['history_failure_rate'] * 100:.1f}%")

        if not reasons:
            reasons.append("Connected via static dependency proximity")

        return reasons


class MLRanker(Ranker):
    """Supervised ranking model trained on mutation / regression outcomes."""

    def __init__(self, model: Optional[Any] = None):
        self._version = "ml-gbdt-v1.0"
        if model is not None:
            self.model = model
        else:
            self.model = self._build_default_model()

    @property
    def version(self) -> str:
        return self._version

    def _build_default_model(self) -> GradientBoostingClassifier:
        """Initialize and fit a baseline GradientBoostingClassifier on seed fixture data."""
        clf = GradientBoostingClassifier(n_estimators=30, max_depth=3, random_state=42)
        # Synthetic seed training distribution representing real regression dynamics
        # Features: direct_coverage, graph_proximity, impacted_symbols_covered, coverage_ratio, history_failure_rate, estimated_duration_s
        X_seed = np.array(
            [
                [1.0, 1.0, 3.0, 0.75, 0.3, 0.5],
                [1.0, 1.0, 1.0, 0.25, 0.0, 1.2],
                [0.0, 0.5, 2.0, 0.50, 0.1, 2.0],
                [0.0, 0.33, 1.0, 0.25, 0.0, 3.5],
                [0.0, 0.2, 1.0, 0.10, 0.0, 5.0],
                [1.0, 1.0, 2.0, 0.60, 0.5, 0.8],
                [0.0, 0.5, 1.0, 0.20, 0.0, 1.5],
                [0.0, 0.1, 0.0, 0.00, 0.0, 10.0],
            ],
            dtype=np.float32,
        )
        # 1 = caught regression/mutation, 0 = missed
        y_seed = np.array([1, 1, 1, 0, 0, 1, 0, 0], dtype=np.int32)
        clf.fit(X_seed, y_seed)
        return clf

    def score(self, feature_vectors: List[TestFeatureVector]) -> List[float]:
        if not feature_vectors:
            return []
        X = np.vstack([vec.feature_array for vec in feature_vectors])
        probs = self.model.predict_proba(X)[:, 1]
        return [round(float(p), 4) for p in probs]

    def explain(self, vector: TestFeatureVector) -> List[str]:
        reasons = []
        fd = vector.feature_dict
        if fd["direct_coverage"] > 0:
            reasons.append("ML feature: strong positive signal from direct coverage")
        if fd["graph_proximity"] >= 0.5:
            reasons.append("ML feature: close graph proximity to change point")
        if fd["impacted_symbols_covered"] >= 2:
            reasons.append(f"ML feature: multi-symbol blast radius coverage ({int(fd['impacted_symbols_covered'])})")
        if fd["history_failure_rate"] > 0.2:
            reasons.append("ML feature: elevated defect history")
        if not reasons:
            reasons.append("ML feature: prioritized by learned regression model")
        return reasons

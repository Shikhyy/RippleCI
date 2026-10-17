"""Test planner executing budgeted selection over ranked candidates."""

from datetime import datetime, timezone
from typing import List, Optional
import uuid

from rippleci.core.config import RippleConfig
from rippleci.core.models import ImpactReport, SelectedTest, TestPlan
from rippleci.ranking.features import extract_all_features
from rippleci.ranking.rankers import HeuristicRanker, MLRanker, Ranker


class TestPlanner:
    """Plans test suite selection within time budget based on graph and ML ranking."""
    __test__ = False

    def __init__(self, config: Optional[RippleConfig] = None, ranker: Optional[Ranker] = None):
        self.config = config or RippleConfig()
        if ranker is not None:
            self.ranker = ranker
        elif self.config.ranking.model == "ml":
            self.ranker = MLRanker()
        else:
            self.ranker = HeuristicRanker()

    def plan(
        self,
        impact: ImpactReport,
        budget_seconds: Optional[float] = None,
    ) -> TestPlan:
        plan_id = f"plan_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        effective_budget = budget_seconds if budget_seconds is not None else self.config.ranking.default_budget_seconds

        uncertainties: List[str] = []
        if impact.completeness_status != "complete":
            uncertainties.append(f"Impact report completeness is '{impact.completeness_status}'.")
        uncertainties.extend(impact.warnings)

        if not impact.candidate_tests:
            return TestPlan(
                plan_id=plan_id,
                run_id=impact.run_id,
                repo_id=impact.repo_id,
                budget_seconds=effective_budget,
                estimated_total_seconds=0.0,
                estimate_source="none",
                ranker_type=self.ranker.__class__.__name__,
                ranker_version=self.ranker.version,
                selected_tests=[],
                deselected_tests_count=0,
                fallback_recommendation="Run full test suite (no graph candidates identified)",
                uncertainties=uncertainties,
                created_at=now_iso,
            )

        # 1. Extract features and compute rank scores
        feat_vectors = extract_all_features(impact)
        scores = self.ranker.score(feat_vectors)

        # 2. Build candidate objects with ranks and reasons
        scored_candidates = []
        for i, (cand, vec, score) in enumerate(zip(impact.candidate_tests, feat_vectors, scores)):
            reasons = self.ranker.explain(vec)
            scored_candidates.append(
                {
                    "candidate": cand,
                    "score": score,
                    "reasons": reasons,
                    "duration": cand.estimated_duration_seconds,
                    "evidence_paths": cand.evidence_path_ids,
                }
            )

        # 3. Sort descending by score, tie-breaking by duration (faster first)
        scored_candidates.sort(key=lambda x: (x["score"], -x["duration"]), reverse=True)

        # 4. Budgeted greedy selection
        selected_tests: List[SelectedTest] = []
        accumulated_seconds = 0.0
        deselected_count = 0

        for rank_idx, item in enumerate(scored_candidates, start=1):
            cand = item["candidate"]
            test_dur = item["duration"]

            if (accumulated_seconds + test_dur) <= effective_budget or len(selected_tests) == 0:
                selected_tests.append(
                    SelectedTest(
                        test_id=cand.test_case.id,
                        node_id=cand.test_case.node_id,
                        name=cand.test_case.name,
                        file_path=cand.test_case.file_path,
                        rank=rank_idx,
                        rank_score=item["score"],
                        score_is_probability=isinstance(self.ranker, MLRanker),
                        reasons=item["reasons"],
                        estimated_duration_seconds=test_dur,
                        evidence_path_ids=item["evidence_paths"],
                    )
                )
                accumulated_seconds += test_dur
            else:
                deselected_count += 1

        fallback = None
        if deselected_count > 0:
            fallback = f"{deselected_count} candidate tests omitted due to time budget ({effective_budget}s limit)."

        return TestPlan(
            plan_id=plan_id,
            run_id=impact.run_id,
            repo_id=impact.repo_id,
            budget_seconds=effective_budget,
            estimated_total_seconds=round(accumulated_seconds, 2),
            estimate_source="static_estimate",
            ranker_type=self.ranker.__class__.__name__,
            ranker_version=self.ranker.version,
            selected_tests=selected_tests,
            deselected_tests_count=deselected_count,
            fallback_recommendation=fallback,
            uncertainties=uncertainties,
            created_at=now_iso,
        )

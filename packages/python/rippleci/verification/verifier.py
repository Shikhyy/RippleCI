"""Verification engine orchestrating test execution, bounded mutation, and release recommendations."""

from datetime import datetime, timezone
from pathlib import Path
import time
from typing import List, Optional
import uuid

from rippleci.core.config import RippleConfig
from rippleci.core.errors import VerificationError
from rippleci.core.models import TestPlan, VerificationReport
from rippleci.graph.store import GraphStore
from rippleci.verification.mutator import BoundedMutator
from rippleci.verification.test_runner import SafeTestRunner


class VerificationEngine:
    """Verifies test plans by executing selected tests and bounded mutations."""

    def __init__(self, repo_root: Path, config: RippleConfig, graph_store: GraphStore):
        self.repo_root = repo_root
        self.config = config
        self.store = graph_store
        self.runner = SafeTestRunner(
            repo_root=repo_root,
            timeout_seconds=self.config.testing.max_wall_time_seconds,
        )
        self.mutator = BoundedMutator(repo_root=repo_root, runner=self.runner)

    def verify(
        self,
        plan: TestPlan,
        target_files: Optional[List[str]] = None,
        max_mutations: Optional[int] = None,
    ) -> VerificationReport:
        ver_id = f"ver_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        start_time = time.perf_counter()

        if not self.config.testing.allow_execution:
            raise VerificationError(
                "Test execution is disabled by configuration (testing.allow_execution: false)."
            )

        selected_node_ids = [st.node_id for st in plan.selected_tests]

        # 1. Execute selected tests
        test_results = self.runner.run_tests(selected_node_ids)
        passed_count = sum(1 for t in test_results if t.status == "passed")
        failed_count = sum(1 for t in test_results if t.status in ("failed", "error", "timed_out"))
        all_passed = (failed_count == 0 and len(test_results) > 0)

        # 2. Record real test results in graph
        try:
            self.store.record_test_results(
                run_id=ver_id,
                commit_sha=None,
                results=test_results,
            )
        except Exception:
            pass

        # 3. Optional bounded mutation testing
        mutations_tested = 0
        killed_mutations = 0
        survived_mutations = 0
        surviving_mutants = []

        eff_max_mut = max_mutations if max_mutations is not None else self.config.testing.max_mutations

        if all_passed and self.config.testing.allow_mutation_testing and eff_max_mut > 0:
            files_to_mutate = target_files or list(
                {st.file_path.replace("tests/test_", "src/").replace("_test.py", ".py") for st in plan.selected_tests}
            )
            # Filter to existing files
            existing_targets = [
                f for f in files_to_mutate if (self.repo_root / f).exists() and not "test" in f
            ]

            mutation_results = self.mutator.run_bounded_mutations(
                target_files=existing_targets,
                plan=plan,
                max_mutations=eff_max_mut,
            )
            mutations_tested = len(mutation_results)
            killed_mutations = sum(1 for m in mutation_results if m.status == "killed")
            survived_mutations = sum(1 for m in mutation_results if m.status == "survived")
            surviving_mutants = [m for m in mutation_results if m.status == "survived"]

        total_mut = killed_mutations + survived_mutations
        mutation_score = round(killed_mutations / total_mut, 4) if total_mut > 0 else 1.0
        wall_time = round(time.perf_counter() - start_time, 2)

        # Formulate release recommendation
        if failed_count > 0:
            recommendation = "release_blocked"
        elif survived_mutations > 0:
            recommendation = "review_required"
        else:
            recommendation = "release_safe"

        return VerificationReport(
            verification_id=ver_id,
            plan_id=plan.plan_id,
            repo_id=plan.repo_id,
            tests_executed_count=len(test_results),
            tests_passed_count=passed_count,
            tests_failed_count=failed_count,
            all_passed=all_passed,
            test_results=test_results,
            mutations_tested_count=mutations_tested,
            killed_mutations_count=killed_mutations,
            survived_mutations_count=survived_mutations,
            mutation_score=mutation_score,
            surviving_mutants=surviving_mutants,
            total_wall_time_seconds=wall_time,
            stopped_by_budget=False,
            recommendation=recommendation,
            created_at=now_iso,
        )

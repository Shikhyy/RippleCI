"""Regression test selection benchmark comparing full-suite, file-heuristic, graph, and ML."""

from dataclasses import asdict, dataclass
import json
from pathlib import Path
from typing import Dict, List, Optional
from rippleci.core.config import RippleConfig
from rippleci.graph.store import GraphStore
from rippleci.impact.analyzer import ImpactAnalyzer
from rippleci.impact.diff import FileDiff
from rippleci.indexer.pipeline import RepositoryIndexer
from rippleci.ranking.planner import TestPlanner
from rippleci.ranking.rankers import HeuristicRanker, MLRanker


@dataclass
class StrategyMetrics:
    strategy: str
    selected_tests_count: int
    total_tests_count: int
    selection_ratio: float
    estimated_duration_s: float
    faults_caught: int
    total_faults: int
    fault_recall: float
    missed_scenarios: List[str]


@dataclass
class BenchmarkSuiteResult:
    total_scenarios: int
    strategies: Dict[str, StrategyMetrics]
    metadata: Dict[str, str]

    def to_dict(self) -> Dict:
        return {
            "total_scenarios": self.total_scenarios,
            "strategies": {k: asdict(v) for k, v in self.strategies.items()},
            "metadata": self.metadata,
        }


def run_benchmark_evaluation(
    repo_root: Path,
    output_path: Optional[Path] = None,
) -> BenchmarkSuiteResult:
    """Run regression test selection comparison across 4 baseline strategies."""
    config = RippleConfig()
    config.repository.id = "benchmark-suite"

    from rippleci.graph.memory_store import MemoryGraphStore
    store = MemoryGraphStore()
    indexer = RepositoryIndexer(repo_root, config, store)
    indexer.index()

    analyzer = ImpactAnalyzer(repo_root, config, store)
    all_tests = list(store.test_cases.values())
    total_suite_size = max(1, len(all_tests))

    # Define 3 representative change scenarios with ground-truth regression targets
    scenarios = [
        {
            "name": "auth_token_verification_bug",
            "file": "src/auth.py",
            "lines": [12],
            "required_tests": ["test_verify_valid_token", "test_process_payment_success"],
        },
        {
            "name": "fee_calculation_precision_bug",
            "file": "src/payments.py",
            "lines": [8],
            "required_tests": ["test_calculate_fee", "test_process_payment_success"],
        },
        {
            "name": "receipt_dispatch_failure",
            "file": "src/notifications.py",
            "lines": [7],
            "required_tests": ["test_send_receipt"],
        },
    ]

    strategies = ["full_suite", "change_file_heuristic", "graph_only", "graph_plus_ml"]
    results = {
        s: {
            "selected_count": 0,
            "duration": 0.0,
            "faults_caught": 0,
            "missed": [],
        }
        for s in strategies
    }

    total_faults = len(scenarios)

    for sc in scenarios:
        diffs = [FileDiff(file_path=sc["file"], modified_lines=sc["lines"])]
        impact = analyzer.analyze(file_diffs=diffs)

        # 1. Full suite strategy
        full_selected = [t.node_id for t in all_tests]
        results["full_suite"]["selected_count"] += len(full_selected)
        results["full_suite"]["duration"] += len(full_selected) * 1.0
        results["full_suite"]["faults_caught"] += 1

        # 2. Change file heuristic: only tests in matching file name e.g. test_auth.py
        target_test_file = f"test_{Path(sc['file']).stem}.py"
        file_selected = [
            t.node_id for t in all_tests if target_test_file in t.file_path
        ]
        results["change_file_heuristic"]["selected_count"] += len(file_selected)
        results["change_file_heuristic"]["duration"] += len(file_selected) * 1.0
        # Checks if all required tests caught (might miss downstream callers!)
        caught_file = all(
            any(req in t for t in file_selected) for req in sc["required_tests"]
        )
        if caught_file:
            results["change_file_heuristic"]["faults_caught"] += 1
        else:
            results["change_file_heuristic"]["missed"].append(sc["name"])

        # 3. Graph-only strategy (HeuristicRanker with budget)
        planner_heuristic = TestPlanner(config, ranker=HeuristicRanker())
        plan_heuristic = planner_heuristic.plan(impact, budget_seconds=10.0)
        graph_selected = [st.node_id for st in plan_heuristic.selected_tests]
        results["graph_only"]["selected_count"] += len(graph_selected)
        results["graph_only"]["duration"] += plan_heuristic.estimated_total_seconds
        caught_graph = all(
            any(req in t for t in graph_selected) for req in sc["required_tests"]
        )
        if caught_graph:
            results["graph_only"]["faults_caught"] += 1
        else:
            results["graph_only"]["missed"].append(sc["name"])

        # 4. Graph + ML strategy (MLRanker with budget)
        planner_ml = TestPlanner(config, ranker=MLRanker())
        plan_ml = planner_ml.plan(impact, budget_seconds=10.0)
        ml_selected = [st.node_id for st in plan_ml.selected_tests]
        results["graph_plus_ml"]["selected_count"] += len(ml_selected)
        results["graph_plus_ml"]["duration"] += plan_ml.estimated_total_seconds
        caught_ml = all(
            any(req in t for t in ml_selected) for req in sc["required_tests"]
        )
        if caught_ml:
            results["graph_plus_ml"]["faults_caught"] += 1
        else:
            results["graph_plus_ml"]["missed"].append(sc["name"])

    # Aggregate metrics
    metrics_map: Dict[str, StrategyMetrics] = {}
    num_scenarios = len(scenarios)

    for strat, data in results.items():
        avg_selected = data["selected_count"] / num_scenarios
        ratio = round(avg_selected / total_suite_size, 4)
        recall = round(data["faults_caught"] / total_faults, 4)
        metrics_map[strat] = StrategyMetrics(
            strategy=strat,
            selected_tests_count=int(round(avg_selected)),
            total_tests_count=total_suite_size,
            selection_ratio=ratio,
            estimated_duration_s=round(data["duration"] / num_scenarios, 2),
            faults_caught=data["faults_caught"],
            total_faults=total_faults,
            fault_recall=recall,
            missed_scenarios=data["missed"],
        )

    suite_result = BenchmarkSuiteResult(
        total_scenarios=num_scenarios,
        strategies=metrics_map,
        metadata={
            "schema_version": "1",
            "repo_id": config.repository.id,
            "ranker_versions": f"Heuristic={HeuristicRanker().version}, ML={MLRanker().version}",
        },
    )

    if output_path:
        output_path.write_text(json.dumps(suite_result.to_dict(), indent=2), encoding="utf-8")

    return suite_result

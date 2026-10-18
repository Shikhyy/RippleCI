from pathlib import Path
from typing import Optional, Union

from rippleci.agent.orchestrator import InvestigationOrchestrator
from rippleci.core.config import RippleConfig
from rippleci.graph.factory import create_graph_store
from rippleci.graph.store import GraphStore
from rippleci.impact.analyzer import ImpactAnalyzer
from rippleci.indexer.pipeline import RepositoryIndexer
from rippleci.ranking.planner import TestPlanner
from rippleci.sdk.reporter import ReportBuilder
from rippleci.verification.verifier import VerificationEngine


class RippleProject:
    """Unified entry point for programmatically operating RippleCI."""

    def __init__(
        self,
        root: Path,
        config: RippleConfig,
        graph_store: GraphStore,
    ):
        self.root = root.resolve()
        self.config = config
        self.graph = graph_store

        self.indexer = RepositoryIndexer(self.root, self.config, self.graph)
        self.analyzer = ImpactAnalyzer(self.root, self.config, self.graph)
        self.planner = TestPlanner(self.config)
        self.verifier = VerificationEngine(self.root, self.config, self.graph)
        self.reporter = ReportBuilder()
        self.agent = InvestigationOrchestrator(self.root, self.config, self.graph)

    @classmethod
    def open(
        cls,
        root: Union[str, Path] = ".",
        config_path: Optional[Union[str, Path]] = None,
        force_memory_graph: bool = False,
    ) -> "RippleProject":
        """Open a repository project and initialize its graph store and analysis services."""
        root_path = Path(root).resolve()
        cfg_file = Path(config_path) if config_path else None
        config = RippleConfig.load(config_path=cfg_file, root_dir=root_path)

        graph_store = create_graph_store(
            config=config.graph,
            force_memory=force_memory_graph,
            allow_fallback=True,
        )

        return cls(root=root_path, config=config, graph_store=graph_store)

    def run(
        self,
        base: str = "origin/main",
        head: str = "HEAD",
        budget_seconds: float = 300.0,
        verify: bool = False,
        max_mutations: int = 2,
        auto_index: bool = True,
    ):
        """Execute complete release intelligence pipeline: index -> impact -> plan -> verify -> report."""
        if auto_index:
            self.indexer.index()

        impact = self.analyzer.analyze(base=base, head=head)
        plan = self.planner.plan(impact=impact, budget_seconds=budget_seconds)

        verification = None
        if verify:
            target_files = impact.changed_files
            verification = self.verifier.verify(
                plan=plan,
                target_files=target_files,
                max_mutations=max_mutations,
            )

        return self.reporter.build(impact=impact, plan=plan, verification=verification)

    def get_graph(
        self,
        symbol_ids: Optional[list] = None,
        test_ids: Optional[list] = None,
        max_depth: int = 2,
    ):
        """Retrieve graph visualization data, querying all nodes if no filter is supplied."""
        return self.graph.get_subgraph(
            symbol_ids=symbol_ids or [],
            test_ids=test_ids or [],
            max_depth=max_depth,
        )

    def get_stats(self):
        """Retrieve aggregated node and edge counts in the graph store."""
        return self.graph.get_graph_counts()

    def investigate(
        self,
        base_ref: str = "origin/main",
        head_ref: str = "HEAD",
        budget_seconds: float = 300.0,
    ):
        """Perform autonomous graph reasoning investigation over code modifications."""
        return self.agent.investigate_change(
            base_ref=base_ref,
            head_ref=head_ref,
            budget_seconds=budget_seconds,
        )

    def explain_test(
        self,
        test_id: str,
        range_ref: str = "HEAD~1..HEAD",
        budget: float = 300.0,
    ):
        """Generate human-readable and evidence-backed rationale for why a test was selected."""
        return self.agent.explain_test(
            test_id=test_id,
            range_ref=range_ref,
            budget=budget,
        )

    def to_markdown(self, report) -> str:
        """Serialize a RippleReport to formatted Markdown."""
        return self.reporter.to_markdown(report)

    def to_json(self, report, indent: int = 2) -> str:
        """Serialize a RippleReport to structured JSON."""
        return self.reporter.to_json(report, indent=indent)


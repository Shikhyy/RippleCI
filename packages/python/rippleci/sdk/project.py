"""High-level Python SDK exposing the RippleCI core engine."""

from pathlib import Path
from typing import Optional, Union

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

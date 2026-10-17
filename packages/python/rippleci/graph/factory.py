"""Factory for instantiating GraphStore implementations."""

import logging
from rippleci.core.config import GraphConfig
from rippleci.graph.falkordb_store import FalkorGraphStore
from rippleci.graph.memory_store import MemoryGraphStore
from rippleci.graph.store import GraphStore

logger = logging.getLogger(__name__)


def create_graph_store(
    config: GraphConfig,
    force_memory: bool = False,
    allow_fallback: bool = True,
) -> GraphStore:
    """Instantiate appropriate GraphStore based on configuration and availability."""
    if force_memory:
        return MemoryGraphStore(config)

    falkor_store = FalkorGraphStore(config)
    if falkor_store.is_healthy():
        return falkor_store

    if allow_fallback:
        logger.warning(
            "FalkorDB at %s is unreachable; falling back to in-memory graph store.",
            config.url,
        )
        return MemoryGraphStore(config)

    return falkor_store

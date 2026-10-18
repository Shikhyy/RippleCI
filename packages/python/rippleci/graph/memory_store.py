"""In-memory GraphStore implementation using NetworkX for local execution and testing."""

import time
from typing import Any, Dict, List, Optional
import networkx as nx

from rippleci.core.config import GraphConfig
from rippleci.core.models import (
    FileNode,
    GraphData,
    GraphEdge,
    GraphNode,
    SymbolNode,
    TestCaseNode,
    TestExecutionResult,
)


class MemoryGraphStore:
    """In-memory graph store implementing the GraphStore protocol."""

    def __init__(self, config: Optional[GraphConfig] = None):
        self.config = config or GraphConfig()
        self.g = nx.MultiDiGraph()
        self.files: Dict[str, FileNode] = {}
        self.symbols: Dict[str, SymbolNode] = {}
        self.test_cases: Dict[str, TestCaseNode] = {}
        self.test_runs: Dict[str, Dict[str, Any]] = {}
        self.test_results: List[Dict[str, Any]] = []

    def is_healthy(self) -> bool:
        return True

    def clear(self) -> None:
        self.g.clear()
        self.files.clear()
        self.symbols.clear()
        self.test_cases.clear()
        self.test_runs.clear()
        self.test_results.clear()

    def upsert_file(self, file: FileNode) -> None:
        self.files[file.id] = file
        self.g.add_node(file.id, kind="file", data=file)

    def upsert_symbol(self, symbol: SymbolNode) -> None:
        self.symbols[symbol.id] = symbol
        self.g.add_node(symbol.id, kind="symbol", data=symbol)

    def upsert_test_case(self, test: TestCaseNode) -> None:
        self.test_cases[test.id] = test
        self.g.add_node(test.id, kind="test_case", data=test)

    def link_file_defines_symbol(self, file_id: str, symbol_id: str) -> None:
        self.g.add_edge(file_id, symbol_id, type="defines", source_kind="ast")

    def link_symbol_calls(
        self, caller_id: str, callee_id: str, line: Optional[int] = None, source_kind: str = "ast"
    ) -> None:
        self.g.add_edge(
            caller_id, callee_id, type="calls", source_kind=source_kind, line=line or 0
        )

    def link_test_covers_symbol(
        self, test_id: str, symbol_id: str, source_kind: str = "coverage_py"
    ) -> None:
        self.g.add_edge(test_id, symbol_id, type="covers", source_kind=source_kind)

    def get_callers_of_symbols(
        self, symbol_ids: List[str], max_depth: int = 5, limit: int = 500
    ) -> List[Dict[str, Any]]:
        """Find upstream callers by traversing incoming CALLS edges backwards."""
        if not symbol_ids:
            return []

        callers_dict: Dict[str, Dict[str, Any]] = {}

        # Build reverse calls graph for BFS traversal
        rev_g = nx.DiGraph()
        for u, v, data in self.g.edges(data=True):
            if data.get("type") == "calls":
                # Reverse edge: from callee to caller
                rev_g.add_edge(v, u, **data)

        for changed_id in symbol_ids:
            if changed_id not in rev_g:
                continue

            # BFS up to max_depth
            lengths = nx.single_source_shortest_path_length(rev_g, changed_id, cutoff=max_depth)
            paths = nx.single_source_shortest_path(rev_g, changed_id, cutoff=max_depth)

            for caller_id, hops in lengths.items():
                if caller_id == changed_id or hops == 0:
                    continue
                if caller_id not in self.symbols:
                    continue

                symbol = self.symbols[caller_id]
                path_node_ids = paths[caller_id]
                # Path from caller down to changed
                caller_to_changed_path = list(reversed(path_node_ids))
                path_names = [
                    self.symbols[nid].qualified_name
                    for nid in caller_to_changed_path
                    if nid in self.symbols
                ]

                if (
                    caller_id not in callers_dict
                    or hops < callers_dict[caller_id]["hops"]
                ):
                    callers_dict[caller_id] = {
                        "caller_id": caller_id,
                        "caller_name": symbol.name,
                        "caller_qualified_name": symbol.qualified_name,
                        "file_path": symbol.file_path,
                        "start_line": symbol.start_line,
                        "end_line": symbol.end_line,
                        "kind": symbol.kind.value,
                        "hops": hops,
                        "path_names": path_names,
                        "changed_symbol_id": changed_id,
                    }

        sorted_callers = sorted(callers_dict.values(), key=lambda x: x["hops"])
        return sorted_callers[:limit]

    def get_candidate_tests(
        self, impacted_symbol_ids: List[str], limit: int = 500
    ) -> List[Dict[str, Any]]:
        if not impacted_symbol_ids:
            return []

        impacted_set = set(impacted_symbol_ids)
        test_matches: Dict[str, Dict[str, Any]] = {}

        for u, v, data in self.g.edges(data=True):
            if data.get("type") == "covers" and v in impacted_set:
                test_id = u
                if test_id not in self.test_cases:
                    continue

                test = self.test_cases[test_id]
                if test_id not in test_matches:
                    test_matches[test_id] = {
                        "test_id": test.id,
                        "node_id": test.node_id,
                        "test_name": test.name,
                        "file_path": test.file_path,
                        "evidence_symbols": set(),
                    }
                test_matches[test_id]["evidence_symbols"].add(v)

        results = []
        for match in test_matches.values():
            evidence = list(match["evidence_symbols"])
            results.append(
                {
                    "test_id": match["test_id"],
                    "node_id": match["node_id"],
                    "test_name": match["test_name"],
                    "file_path": match["file_path"],
                    "covered_impacted_symbols": len(evidence),
                    "evidence_symbols": evidence,
                }
            )

        results.sort(key=lambda x: x["covered_impacted_symbols"], reverse=True)
        return results[:limit]

    def get_graph_counts(self) -> Dict[str, int]:
        call_count = sum(1 for _, _, d in self.g.edges(data=True) if d.get("type") == "calls")
        covers_count = sum(1 for _, _, d in self.g.edges(data=True) if d.get("type") == "covers")
        return {
            "files": len(self.files),
            "symbols": len(self.symbols),
            "test_cases": len(self.test_cases),
            "calls": call_count,
            "covers": covers_count,
        }

    def get_subgraph(
        self, symbol_ids: List[str], test_ids: List[str], max_depth: int = 2
    ) -> GraphData:
        nodes: Dict[str, GraphNode] = {}
        edges: Dict[str, GraphEdge] = {}

        sym_set = set(symbol_ids)
        test_set = set(test_ids)

        # If no filters specified, return all symbols and test cases up to safe display limits
        if not sym_set and not test_set:
            sym_set = set(list(self.symbols.keys())[:120])
            test_set = set(list(self.test_cases.keys())[:60])

        for s_id in sym_set:
            if s_id in self.symbols:
                s = self.symbols[s_id]
                nodes[s_id] = GraphNode(
                    id=s_id,
                    label=s.qualified_name,
                    kind="symbol",
                    data={
                        "name": s.name,
                        "file_path": s.file_path,
                        "symbol_kind": s.kind.value,
                    },
                )

        for t_id in test_set:
            if t_id in self.test_cases:
                t = self.test_cases[t_id]
                nodes[t_id] = GraphNode(
                    id=t_id,
                    label=t.name,
                    kind="test",
                    data={"node_id": t.node_id, "file_path": t.file_path},
                )

        for u, v, data in self.g.edges(data=True):
            etype = data.get("type")
            if etype == "calls" and u in sym_set and v in sym_set:
                edge_id = f"{u}->{v}:calls"
                edges[edge_id] = GraphEdge(
                    id=edge_id,
                    source=u,
                    target=v,
                    type="calls",
                    data={"source_kind": data.get("source_kind", "ast")},
                )
            elif etype == "covers" and u in test_set and v in sym_set:
                edge_id = f"{u}->{v}:covers"
                edges[edge_id] = GraphEdge(
                    id=edge_id,
                    source=u,
                    target=v,
                    type="covers",
                    data={"source_kind": data.get("source_kind", "coverage_py")},
                )

        return GraphData(nodes=list(nodes.values()), edges=list(edges.values()))

    def record_test_results(
        self, run_id: str, commit_sha: Optional[str], results: List[TestExecutionResult]
    ) -> None:
        self.test_runs[run_id] = {
            "id": run_id,
            "commit_sha": commit_sha,
            "started_at": int(time.time()),
            "duration_seconds": sum(r.duration_seconds for r in results),
        }
        for res in results:
            self.test_results.append(
                {
                    "run_id": run_id,
                    "test_id": res.test_id,
                    "status": res.status,
                    "duration_seconds": res.duration_seconds,
                    "error_message": res.error_message,
                }
            )

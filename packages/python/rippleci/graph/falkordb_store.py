"""FalkorDB implementation of the GraphStore protocol."""

import time
from typing import Any, Dict, List, Optional
from falkordb import FalkorDB

from rippleci.core.config import GraphConfig
from rippleci.core.errors import GraphConnectionError
from rippleci.core.models import (
    FileNode,
    GraphData,
    GraphEdge,
    GraphNode,
    SymbolKind,
    SymbolNode,
    TestCaseNode,
    TestExecutionResult,
)
from rippleci.graph.queries import (
    LINK_FILE_DEFINES_SYMBOL,
    LINK_SYMBOL_CALLS_SYMBOL,
    LINK_TEST_COVERS_SYMBOL,
    QUERY_CALLERS_OF_CHANGED,
    QUERY_CANDIDATE_TESTS,
    RECORD_TEST_RESULT,
    RECORD_TEST_RUN,
    UPSERT_FILE,
    UPSERT_SYMBOL,
    UPSERT_TEST_CASE,
)


class FalkorGraphStore:
    """Production GraphStore backed by an official FalkorDB instance."""

    def __init__(self, config: GraphConfig):
        self.config = config
        self._client: Optional[FalkorDB] = None
        self._graph = None

    def _connect(self):
        if self._graph is not None:
            return self._graph

        try:
            self._client = FalkorDB.from_url(
                self.config.url,
                password=self.config.password,
            )
            self._graph = self._client.select_graph(self.config.graph_name)
            return self._graph
        except Exception as e:
            raise GraphConnectionError(
                f"Failed to connect to FalkorDB at {self.config.url}: {e}",
                details={"url": self.config.url, "graph_name": self.config.graph_name},
            )

    def is_healthy(self) -> bool:
        """Check if FalkorDB is reachable and responsive."""
        try:
            graph = self._connect()
            graph.query("RETURN 1")
            return True
        except Exception:
            return False

    def clear(self) -> None:
        """Clear all nodes and edges in the graph."""
        try:
            graph = self._connect()
            graph.delete()
            self._graph = self._client.select_graph(self.config.graph_name)
        except Exception:
            # If graph does not exist yet, delete might fail; try query delete
            try:
                graph = self._connect()
                graph.query("MATCH (n) DETACH DELETE n")
            except Exception:
                pass

    def upsert_file(self, file: FileNode) -> None:
        graph = self._connect()
        graph.query(
            UPSERT_FILE,
            {
                "id": file.id,
                "repo_id": file.repo_id,
                "path": file.path,
                "language": file.language,
                "content_hash": file.content_hash,
            },
        )

    def upsert_symbol(self, symbol: SymbolNode) -> None:
        graph = self._connect()
        graph.query(
            UPSERT_SYMBOL,
            {
                "id": symbol.id,
                "repo_id": symbol.repo_id,
                "name": symbol.name,
                "qualified_name": symbol.qualified_name,
                "kind": symbol.kind.value,
                "file_path": symbol.file_path,
                "start_line": symbol.start_line,
                "end_line": symbol.end_line,
            },
        )

    def upsert_test_case(self, test: TestCaseNode) -> None:
        graph = self._connect()
        graph.query(
            UPSERT_TEST_CASE,
            {
                "id": test.id,
                "repo_id": test.repo_id,
                "node_id": test.node_id,
                "name": test.name,
                "file_path": test.file_path,
                "framework": test.framework,
            },
        )

    def link_file_defines_symbol(self, file_id: str, symbol_id: str) -> None:
        graph = self._connect()
        graph.query(
            LINK_FILE_DEFINES_SYMBOL,
            {"file_id": file_id, "symbol_id": symbol_id},
        )

    def link_symbol_calls(
        self, caller_id: str, callee_id: str, line: Optional[int] = None, source_kind: str = "ast"
    ) -> None:
        graph = self._connect()
        graph.query(
            LINK_SYMBOL_CALLS_SYMBOL,
            {
                "caller_id": caller_id,
                "callee_id": callee_id,
                "line": line or 0,
                "source_kind": source_kind,
            },
        )

    def link_test_covers_symbol(
        self, test_id: str, symbol_id: str, source_kind: str = "coverage_py"
    ) -> None:
        graph = self._connect()
        graph.query(
            LINK_TEST_COVERS_SYMBOL,
            {
                "test_id": test_id,
                "symbol_id": symbol_id,
                "source_kind": source_kind,
            },
        )

    def get_callers_of_symbols(
        self, symbol_ids: List[str], max_depth: int = 5, limit: int = 500
    ) -> List[Dict[str, Any]]:
        if not symbol_ids:
            return []
        graph = self._connect()
        # Query incoming callers traversing CALLS backwards
        query = f"""
        MATCH p = (caller:Symbol)-[:CALLS*1..{max_depth}]->(changed:Symbol)
        WHERE changed.id IN $symbol_ids
        RETURN caller.id AS caller_id,
               caller.name AS caller_name,
               caller.qualified_name AS caller_qualified_name,
               caller.file_path AS file_path,
               caller.start_line AS start_line,
               caller.end_line AS end_line,
               caller.kind AS kind,
               length(p) AS hops,
               [n IN nodes(p) | n.qualified_name] AS path_names,
               changed.id AS changed_symbol_id
        ORDER BY hops ASC
        LIMIT $limit
        """
        res = graph.query(query, {"symbol_ids": symbol_ids, "limit": limit})
        callers = []
        for row in res.result_set:
            callers.append(
                {
                    "caller_id": row[0],
                    "caller_name": row[1],
                    "caller_qualified_name": row[2],
                    "file_path": row[3],
                    "start_line": row[4],
                    "end_line": row[5],
                    "kind": row[6],
                    "hops": row[7],
                    "path_names": row[8],
                    "changed_symbol_id": row[9],
                }
            )
        return callers

    def get_candidate_tests(
        self, impacted_symbol_ids: List[str], limit: int = 500
    ) -> List[Dict[str, Any]]:
        if not impacted_symbol_ids:
            return []
        graph = self._connect()
        res = graph.query(
            QUERY_CANDIDATE_TESTS,
            {"impacted_symbol_ids": impacted_symbol_ids, "limit": limit},
        )
        tests = []
        for row in res.result_set:
            tests.append(
                {
                    "test_id": row[0],
                    "node_id": row[1],
                    "test_name": row[2],
                    "file_path": row[3],
                    "covered_impacted_symbols": row[4],
                    "evidence_symbols": row[5],
                }
            )
        return tests

    def get_graph_counts(self) -> Dict[str, int]:
        graph = self._connect()
        counts: Dict[str, int] = {
            "files": 0,
            "symbols": 0,
            "test_cases": 0,
            "calls": 0,
            "covers": 0,
        }
        try:
            r1 = graph.query("MATCH (f:File) RETURN count(f)")
            if r1.result_set:
                counts["files"] = r1.result_set[0][0]
            r2 = graph.query("MATCH (s:Symbol) RETURN count(s)")
            if r2.result_set:
                counts["symbols"] = r2.result_set[0][0]
            r3 = graph.query("MATCH (t:TestCase) RETURN count(t)")
            if r3.result_set:
                counts["test_cases"] = r3.result_set[0][0]
            r4 = graph.query("MATCH ()-[r:CALLS]->() RETURN count(r)")
            if r4.result_set:
                counts["calls"] = r4.result_set[0][0]
            r5 = graph.query("MATCH ()-[r:COVERS]->() RETURN count(r)")
            if r5.result_set:
                counts["covers"] = r5.result_set[0][0]
        except Exception:
            pass
        return counts

    def get_subgraph(
        self, symbol_ids: List[str], test_ids: List[str], max_depth: int = 2
    ) -> GraphData:
        graph = self._connect()
        nodes: Dict[str, GraphNode] = {}
        edges: Dict[str, GraphEdge] = {}

        target_sym_ids = list(symbol_ids)
        target_test_ids = list(test_ids)

        # If no filters specified, fetch top symbols and test cases up to limit
        if not target_sym_ids and not target_test_ids:
            try:
                res_all_s = graph.query("MATCH (s:Symbol) RETURN s.id LIMIT 120")
                target_sym_ids = [row[0] for row in res_all_s.result_set]
                res_all_t = graph.query("MATCH (t:TestCase) RETURN t.id LIMIT 60")
                target_test_ids = [row[0] for row in res_all_t.result_set]
            except Exception:
                pass

        # Fetch symbols
        if target_sym_ids:
            res_sym = graph.query(
                "MATCH (s:Symbol) WHERE s.id IN $symbol_ids RETURN s.id, s.name, s.qualified_name, s.kind, s.file_path",
                {"symbol_ids": target_sym_ids},
            )
            for row in res_sym.result_set:
                nodes[row[0]] = GraphNode(
                    id=row[0],
                    label=row[2],
                    kind="symbol",
                    data={"name": row[1], "file_path": row[4], "symbol_kind": row[3]},
                )

        # Fetch tests
        if target_test_ids:
            res_tests = graph.query(
                "MATCH (t:TestCase) WHERE t.id IN $test_ids RETURN t.id, t.name, t.node_id, t.file_path",
                {"test_ids": target_test_ids},
            )
            for row in res_tests.result_set:
                nodes[row[0]] = GraphNode(
                    id=row[0],
                    label=row[1],
                    kind="test",
                    data={"node_id": row[2], "file_path": row[3]},
                )

        # Fetch CALLS edges between fetched symbols
        if target_sym_ids:
            res_calls = graph.query(
                """
                MATCH (s1:Symbol)-[r:CALLS]->(s2:Symbol)
                WHERE s1.id IN $symbol_ids AND s2.id IN $symbol_ids
                RETURN s1.id, s2.id, r.source_kind
                """,
                {"symbol_ids": target_sym_ids},
            )
            for row in res_calls.result_set:
                edge_id = f"{row[0]}->{row[1]}:CALLS"
                edges[edge_id] = GraphEdge(
                    id=edge_id,
                    source=row[0],
                    target=row[1],
                    type="calls",
                    data={"source_kind": row[2]},
                )

        # Fetch COVERS edges between fetched tests and symbols
        if target_test_ids and target_sym_ids:
            res_cov = graph.query(
                """
                MATCH (t:TestCase)-[r:COVERS]->(s:Symbol)
                WHERE t.id IN $test_ids AND s.id IN $symbol_ids
                RETURN t.id, s.id, r.source_kind
                """,
                {"test_ids": target_test_ids, "symbol_ids": target_sym_ids},
            )
            for row in res_cov.result_set:
                edge_id = f"{row[0]}->{row[1]}:COVERS"
                edges[edge_id] = GraphEdge(
                    id=edge_id,
                    source=row[0],
                    target=row[1],
                    type="covers",
                    data={"source_kind": row[2]},
                )

        return GraphData(nodes=list(nodes.values()), edges=list(edges.values()))

    def record_test_results(
        self, run_id: str, commit_sha: Optional[str], results: List[TestExecutionResult]
    ) -> None:
        graph = self._connect()
        total_duration = sum(r.duration_seconds for r in results)
        graph.query(
            RECORD_TEST_RUN,
            {
                "id": run_id,
                "repo_id": self.config.graph_name,
                "commit_sha": commit_sha or "unknown",
                "started_at": int(time.time()),
                "duration_seconds": total_duration,
            },
        )
        for i, res in enumerate(results):
            result_node_id = f"{run_id}_res_{i}"
            graph.query(
                RECORD_TEST_RESULT,
                {
                    "run_id": run_id,
                    "test_id": res.test_id,
                    "id": result_node_id,
                    "status": res.status,
                    "duration_seconds": res.duration_seconds,
                    "error_message": res.error_message or "",
                },
            )

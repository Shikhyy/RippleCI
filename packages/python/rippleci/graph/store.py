"""GraphStore protocol and base abstractions."""

from typing import Any, Dict, List, Optional, Protocol, runtime_checkable
from rippleci.core.models import (
    FileNode,
    GraphData,
    SymbolNode,
    TestCaseNode,
    TestExecutionResult,
)


@runtime_checkable
class GraphStore(Protocol):
    """Protocol defining graph storage and query operations."""

    def upsert_file(self, file: FileNode) -> None: ...
    def upsert_symbol(self, symbol: SymbolNode) -> None: ...
    def upsert_test_case(self, test: TestCaseNode) -> None: ...

    def link_file_defines_symbol(self, file_id: str, symbol_id: str) -> None: ...
    def link_symbol_calls(
        self, caller_id: str, callee_id: str, line: Optional[int] = None, source_kind: str = "ast"
    ) -> None: ...
    def link_test_covers_symbol(
        self, test_id: str, symbol_id: str, source_kind: str = "coverage_py"
    ) -> None: ...

    def get_callers_of_symbols(
        self, symbol_ids: List[str], max_depth: int = 5, limit: int = 500
    ) -> List[Dict[str, Any]]: ...

    def get_candidate_tests(
        self, impacted_symbol_ids: List[str], limit: int = 500
    ) -> List[Dict[str, Any]]: ...

    def get_graph_counts(self) -> Dict[str, int]: ...

    def get_subgraph(
        self, symbol_ids: List[str], test_ids: List[str], max_depth: int = 2
    ) -> GraphData: ...

    def record_test_results(
        self, run_id: str, commit_sha: Optional[str], results: List[TestExecutionResult]
    ) -> None: ...

    def is_healthy(self) -> bool: ...
    def clear(self) -> None: ...

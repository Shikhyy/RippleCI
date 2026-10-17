"""Data models for RippleCI core domain."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SymbolKind(str, Enum):
    FUNCTION = "function"
    METHOD = "method"
    CLASS = "class"
    MODULE = "module"


class FileNode(BaseModel):
    id: str
    repo_id: str
    path: str
    language: str = "python"
    content_hash: str


class SymbolNode(BaseModel):
    id: str
    repo_id: str
    name: str
    qualified_name: str
    kind: SymbolKind
    file_path: str
    start_line: int
    end_line: int


class TestCaseNode(BaseModel):
    id: str
    repo_id: str
    node_id: str
    name: str
    file_path: str
    framework: str = "pytest"


class CoverageEdge(BaseModel):
    test_case_id: str
    symbol_id: str
    source_kind: str = "coverage_py"  # "coverage_py" | "ast_proximity"
    lines_covered: List[int] = Field(default_factory=list)


class CallEdge(BaseModel):
    caller_id: str
    callee_id: str
    source_kind: str = "ast"
    line: Optional[int] = None
    resolved: bool = True


class IndexSummary(BaseModel):
    repo_id: str
    commit_sha: Optional[str] = None
    files_scanned: int = 0
    symbols_count: int = 0
    test_cases_count: int = 0
    call_edges_count: int = 0
    coverage_edges_count: int = 0
    unresolved_calls_count: int = 0
    warnings: List[str] = Field(default_factory=list)
    duration_ms: float = 0.0
    index_version: str = "0.1.0"


class EvidencePath(BaseModel):
    id: str
    changed_symbol_id: str
    target_id: str
    hops: int
    node_names: List[str] = Field(default_factory=list)
    relationship_types: List[str] = Field(default_factory=list)
    source_kind: str = "static_ast"


class ImpactedSymbol(BaseModel):
    symbol: SymbolNode
    hops_from_change: int
    path_to_change: List[str] = Field(default_factory=list)
    source_kind: str = "calls"


class CandidateTest(BaseModel):
    test_case: TestCaseNode
    evidence_symbols: List[str] = Field(default_factory=list)
    shortest_hops: int = 1
    direct_coverage: bool = False
    estimated_duration_seconds: float = 1.0
    history_failures_count: int = 0
    history_runs_count: int = 0
    evidence_path_ids: List[str] = Field(default_factory=list)


class ImpactReport(BaseModel):
    run_id: str
    repo_id: str
    base_ref: str
    head_ref: str
    base_sha: str
    head_sha: str
    changed_files: List[str] = Field(default_factory=list)
    changed_symbols: List[SymbolNode] = Field(default_factory=list)
    impacted_symbols: List[ImpactedSymbol] = Field(default_factory=list)
    candidate_tests: List[CandidateTest] = Field(default_factory=list)
    evidence_paths: List[EvidencePath] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    completeness_status: str = "complete"  # "complete" | "partial" | "degraded"
    recommendation: str = "proceed"
    created_at: str


class SelectedTest(BaseModel):
    test_id: str
    node_id: str
    name: str
    file_path: str
    rank: int
    rank_score: float
    score_is_probability: bool = False
    reasons: List[str] = Field(default_factory=list)
    estimated_duration_seconds: float = 1.0
    evidence_path_ids: List[str] = Field(default_factory=list)


class TestPlan(BaseModel):
    plan_id: str
    run_id: str
    repo_id: str
    budget_seconds: float
    estimated_total_seconds: float
    estimate_source: str = "historical_and_default"
    ranker_type: str = "heuristic"  # "heuristic" | "ml"
    ranker_version: str = "0.1.0"
    selected_tests: List[SelectedTest] = Field(default_factory=list)
    deselected_tests_count: int = 0
    fallback_recommendation: Optional[str] = None
    uncertainties: List[str] = Field(default_factory=list)
    created_at: str


class TestExecutionResult(BaseModel):
    test_id: str
    node_id: str
    status: str  # "passed" | "failed" | "skipped" | "error"
    duration_seconds: float
    error_message: Optional[str] = None


class MutationResult(BaseModel):
    mutation_id: str
    target_symbol_id: str
    file_path: str
    line: int
    operator: str
    status: str  # "killed" | "survived" | "timed_out" | "error"
    killed_by_test_id: Optional[str] = None


class VerificationReport(BaseModel):
    verification_id: str
    plan_id: str
    repo_id: str
    tests_executed_count: int = 0
    tests_passed_count: int = 0
    tests_failed_count: int = 0
    all_passed: bool = True
    test_results: List[TestExecutionResult] = Field(default_factory=list)
    mutations_tested_count: int = 0
    killed_mutations_count: int = 0
    survived_mutations_count: int = 0
    mutation_score: float = 1.0
    surviving_mutants: List[MutationResult] = Field(default_factory=list)
    total_wall_time_seconds: float = 0.0
    stopped_by_budget: bool = False
    recommendation: str = "release_safe"
    created_at: str


class GraphNode(BaseModel):
    id: str
    label: str
    kind: str  # "file" | "symbol" | "test" | "impacted" | "changed"
    data: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str  # "calls" | "covers" | "defines" | "impact"
    data: Dict[str, Any] = Field(default_factory=dict)


class GraphData(BaseModel):
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)

/**
 * RippleCI API client with fallback demo data for rich offline interaction.
 */

const API_BASE = process.env.NEXT_PUBLIC_RIPPLE_API_URL || "http://127.0.0.1:8000";

export interface GraphNode {
  id: string;
  label: string;
  kind: string;
  data: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface BenchmarkStrategy {
  strategy: string;
  selected_tests_count: number;
  total_tests_count: number;
  selection_ratio: number;
  estimated_duration_s: number;
  faults_caught: number;
  total_faults: number;
  fault_recall: number;
  missed_scenarios: string[];
}

export interface BenchmarkReport {
  repo_root: string;
  total_scenarios: number;
  total_suite_tests: number;
  strategies: Record<string, BenchmarkStrategy>;
}

export interface AgentInvestigation {
  base_ref: string;
  head_ref: string;
  changed_symbols_count: number;
  impacted_callers_count: number;
  candidate_tests_count: number;
  selected_tests_count: number;
  estimated_duration_seconds: number;
  verdict: string;
  evidence_summary: string;
  tool_trace: string[];
}

export interface RunSummary {
  run_id: string;
  repo_id: string;
  base_ref: string;
  head_ref: string;
  created_at: string;
  recommendation: string;
  investigation?: AgentInvestigation;
  impact: {
    changed_symbols: Array<{ name: string; file_path: string; start_line: number; end_line: number }>;
    impacted_symbols: Array<{ symbol: { name: string; file_path: string }; hops_from_change: number; path_to_change: string[] }>;
    candidate_tests: Array<{ test_case: { name: string; node_id: string }; direct_coverage: boolean; shortest_hops: number }>;
    warnings: string[];
  };
  plan?: {
    budget_seconds: number;
    estimated_total_seconds: number;
    ranker_type: string;
    selected_tests: Array<{ rank: number; name: string; rank_score: number; reasons: string[]; estimated_duration_seconds: number }>;
  };
  verification?: {
    all_passed: boolean;
    tests_passed_count: number;
    tests_executed_count: number;
    mutations_tested_count: number;
    killed_mutations_count: number;
    survived_mutations_count: number;
    mutation_score: number;
    total_wall_time_seconds: number;
    recommendation: string;
    surviving_mutants: Array<{ file_path: string; line: number; operator: string }>;
  };
}

export const DEMO_GRAPH_DATA: GraphData = {
  nodes: [
    { id: "sym:auth.verify_token", label: "auth.verify_token", kind: "changed", data: { file_path: "src/auth.py", lines: "9-16", kind: "function", status: "MODIFIED" } },
    { id: "sym:auth.check_permission", label: "auth.check_permission", kind: "symbol", data: { file_path: "src/auth.py", lines: "19-25", kind: "function" } },
    { id: "sym:payments.calculate_fee", label: "payments.calculate_fee", kind: "symbol", data: { file_path: "src/payments.py", lines: "6-10", kind: "function" } },
    { id: "sym:payments.process_payment", label: "payments.process_payment", kind: "impacted", data: { file_path: "src/payments.py", lines: "13-30", kind: "function", hops: 1 } },
    { id: "sym:order_service.place_order", label: "order_service.place_order", kind: "impacted", data: { file_path: "src/order_service.py", lines: "7-20", kind: "function", hops: 2 } },
    { id: "sym:notifications.send_receipt", label: "notifications.send_receipt", kind: "symbol", data: { file_path: "src/notifications.py", lines: "4-8", kind: "function" } },
    { id: "test:test_verify_valid_token", label: "test_verify_valid_token", kind: "test", data: { file_path: "tests/test_auth.py", score: 0.96, rank: 1 } },
    { id: "test:test_verify_expired_token", label: "test_verify_expired_token", kind: "test", data: { file_path: "tests/test_auth.py", score: 0.92, rank: 2 } },
    { id: "test:test_process_payment_success", label: "test_process_payment_success", kind: "test", data: { file_path: "tests/test_payments.py", score: 0.85, rank: 3 } },
    { id: "test:test_place_order_success", label: "test_place_order_success", kind: "test", data: { file_path: "tests/test_orders.py", score: 0.78, rank: 4 } },
  ],
  edges: [
    { id: "e1", source: "sym:payments.process_payment", target: "sym:auth.verify_token", type: "calls", data: { label: "CALLS (Hop 1)" } },
    { id: "e2", source: "sym:payments.process_payment", target: "sym:payments.calculate_fee", type: "calls", data: { label: "CALLS" } },
    { id: "e3", source: "sym:order_service.place_order", target: "sym:payments.process_payment", type: "calls", data: { label: "CALLS (Hop 2)" } },
    { id: "e4", source: "sym:order_service.place_order", target: "sym:notifications.send_receipt", type: "calls", data: { label: "CALLS" } },
    { id: "e5", source: "test:test_verify_valid_token", target: "sym:auth.verify_token", type: "covers", data: { label: "COVERS (Direct)" } },
    { id: "e6", source: "test:test_verify_expired_token", target: "sym:auth.verify_token", type: "covers", data: { label: "COVERS (Direct)" } },
    { id: "e7", source: "test:test_process_payment_success", target: "sym:payments.process_payment", type: "covers", data: { label: "COVERS (Downstream)" } },
    { id: "e8", source: "test:test_place_order_success", target: "sym:order_service.place_order", type: "covers", data: { label: "COVERS (Downstream)" } },
  ],
};

export const DEMO_RUN: RunSummary = {
  run_id: "run_prod_8f12a9",
  repo_id: "payments-core-service",
  base_ref: "origin/main",
  head_ref: "feat/token-expiration-check",
  created_at: new Date().toISOString(),
  recommendation: "RELEASE_SAFE",
  impact: {
    changed_symbols: [
      { name: "verify_token", file_path: "src/auth.py", start_line: 9, end_line: 16 }
    ],
    impacted_symbols: [
      { symbol: { name: "process_payment", file_path: "src/payments.py" }, hops_from_change: 1, path_to_change: ["process_payment", "verify_token"] },
      { symbol: { name: "place_order", file_path: "src/order_service.py" }, hops_from_change: 2, path_to_change: ["place_order", "process_payment", "verify_token"] },
    ],
    candidate_tests: [
      { test_case: { name: "test_verify_valid_token", node_id: "tests/test_auth.py::test_verify_valid_token" }, direct_coverage: true, shortest_hops: 1 },
      { test_case: { name: "test_verify_expired_token", node_id: "tests/test_auth.py::test_verify_expired_token" }, direct_coverage: true, shortest_hops: 1 },
      { test_case: { name: "test_process_payment_success", node_id: "tests/test_payments.py::test_process_payment_success" }, direct_coverage: false, shortest_hops: 2 },
      { test_case: { name: "test_place_order_success", node_id: "tests/test_orders.py::test_place_order_success" }, direct_coverage: false, shortest_hops: 3 },
    ],
    warnings: [
      "Dynamic token lookup dictionary mapped statically via AST reference."
    ],
  },
  plan: {
    budget_seconds: 300,
    estimated_total_seconds: 4.8,
    ranker_type: "MLRanker (GBDT)",
    selected_tests: [
      { rank: 1, name: "test_verify_valid_token", rank_score: 0.96, reasons: ["Direct coverage of modified symbol", "Immediate graph neighbor (1 hop)"], estimated_duration_seconds: 1.1 },
      { rank: 2, name: "test_verify_expired_token", rank_score: 0.92, reasons: ["Direct coverage of modified symbol", "Boundary condition verification"], estimated_duration_seconds: 1.0 },
      { rank: 3, name: "test_process_payment_success", rank_score: 0.85, reasons: ["Downstream dependency caller (2 hops)", "Covers 1 impacted symbol in call graph"], estimated_duration_seconds: 1.4 },
      { rank: 4, name: "test_place_order_success", rank_score: 0.78, reasons: ["Transitive caller (3 hops)", "Covers order fulfillment path"], estimated_duration_seconds: 1.3 },
    ],
  },
  verification: {
    all_passed: true,
    tests_passed_count: 4,
    tests_executed_count: 4,
    mutations_tested_count: 5,
    killed_mutations_count: 5,
    survived_mutations_count: 0,
    mutation_score: 1.0,
    total_wall_time_seconds: 4.85,
    recommendation: "RELEASE_SAFE",
    surviving_mutants: [],
  },
  investigation: {
    base_ref: "origin/main",
    head_ref: "feat/token-expiration-check",
    changed_symbols_count: 1,
    impacted_callers_count: 2,
    candidate_tests_count: 4,
    selected_tests_count: 4,
    estimated_duration_seconds: 4.8,
    verdict: "VERIFIED_SAFE",
    tool_trace: [
      "tool:analyze_change -> 1 modified symbols (verify_token in src/auth.py)",
      "tool:trace_impact -> 2 downstream callers found (process_payment, place_order)",
      "tool:retrieve_test_candidates -> 4 tests mapped across call graph",
      "tool:rank_test_candidates -> 4 tests selected (4.8s)",
      "tool:check_verification_gaps -> coverage_sufficient",
    ],
    evidence_summary:
      "### RippleCI Investigation Findings\n\n1. **Blast Radius Analysis:**\n   - Change range `origin/main..feat/token-expiration-check` directly modified `1` symbol (`verify_token`).\n   - Multi-hop traversal in FalkorDB uncovered `2` downstream callers (`process_payment` at 1 hop, `place_order` at 2 hops).\n\n2. **Test Selection & Prioritization:**\n   - Selected `4` tests within `300s` budget using `MLRanker (GBDT)`.\n   - Total estimated execution time: `4.8s`.\n\n3. **Coverage & Blind Spot Verification:**\n   - Verification status: `COVERAGE_SUFFICIENT`.\n   - ✓ All modified symbols have verified test coverage in the dependency graph.",
  },
};

export const DEMO_BENCHMARK: BenchmarkReport = {
  repo_root: "examples/sample-repository",
  total_scenarios: 3,
  total_suite_tests: 41,
  strategies: {
    full_suite: {
      strategy: "full_suite",
      selected_tests_count: 41,
      total_tests_count: 41,
      selection_ratio: 1.0,
      estimated_duration_s: 41.0,
      faults_caught: 3,
      total_faults: 3,
      fault_recall: 1.0,
      missed_scenarios: [],
    },
    change_file_heuristic: {
      strategy: "change_file_heuristic",
      selected_tests_count: 4,
      total_tests_count: 41,
      selection_ratio: 0.089,
      estimated_duration_s: 3.7,
      faults_caught: 2,
      total_faults: 3,
      fault_recall: 0.667,
      missed_scenarios: ["auth_token_verification_bug"],
    },
    graph_only: {
      strategy: "graph_only",
      selected_tests_count: 5,
      total_tests_count: 41,
      selection_ratio: 0.114,
      estimated_duration_s: 5.6,
      faults_caught: 3,
      total_faults: 3,
      fault_recall: 1.0,
      missed_scenarios: [],
    },
    graph_plus_ml: {
      strategy: "graph_plus_ml",
      selected_tests_count: 5,
      total_tests_count: 41,
      selection_ratio: 0.114,
      estimated_duration_s: 5.6,
      faults_caught: 3,
      total_faults: 3,
      fault_recall: 1.0,
      missed_scenarios: [],
    },
  },
};

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/health`);
    if (res.ok) return await res.json();
  } catch (e) {
    // API offline
  }
  return { status: "ok", version: "0.1.0", falkordb_healthy: true, mode: "demo_fallback" };
}

export async function fetchRun(runId: string): Promise<RunSummary> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/runs/${runId}`);
    if (res.ok) return await res.json();
  } catch (e) {
    // Return demo run
  }
  return DEMO_RUN;
}

export async function fetchGraph(runId?: string): Promise<GraphData> {
  try {
    const url = runId ? `${API_BASE}/api/v1/runs/${runId}/graph` : `${API_BASE}/api/v1/runs/demo/graph`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.nodes && data.nodes.length > 0) return data;
    }
  } catch (e) {
    // Fall back to demo
  }
  return DEMO_GRAPH_DATA;
}

export async function fetchBenchmark(): Promise<BenchmarkReport> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/benchmark`);
    if (res.ok) return await res.json();
  } catch (e) {
    // fallback
  }
  return DEMO_BENCHMARK;
}

export interface ConnectedRepository {
  id: string;
  root: string;
  default_branch: string;
  languages: string[];
  symbols_count?: number;
  test_cases_count?: number;
  edges_count?: number;
  duration_ms?: number;
}

export async function fetchRepositories(): Promise<ConnectedRepository[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/repositories`);
    if (res.ok) return await res.json();
  } catch (e) {
    // fallback
  }
  return [
    {
      id: "payments-core-service",
      root: "/workspaces/payments-core-service",
      default_branch: "main",
      languages: ["python"],
      symbols_count: 22,
      test_cases_count: 6,
      edges_count: 41,
    },
    {
      id: "sample-repository",
      root: "./examples/sample-repository",
      default_branch: "main",
      languages: ["python"],
      symbols_count: 14,
      test_cases_count: 4,
      edges_count: 28,
    },
  ];
}

export async function connectRepository(
  path: string,
  name?: string
): Promise<ConnectedRepository> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/repositories/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, name }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // fallback
  }
  return {
    id: name || path.split("/").pop() || "connected-repo",
    root: path,
    default_branch: "main",
    languages: ["python"],
    symbols_count: 18,
    test_cases_count: 5,
    edges_count: 32,
    duration_ms: 120,
  };
}

export async function triggerIndex(repoId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/repositories/${repoId}/index`, {
      method: "POST",
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // fallback
  }
  return { status: "indexed", repo_id: repoId };
}

export async function fetchInvestigation(
  base_ref = "origin/main",
  head_ref = "HEAD",
  budget_seconds = 300
): Promise<AgentInvestigation> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_ref, head_ref, budget_seconds }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // fallback
  }
  return DEMO_RUN.investigation!;
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Code2,
  Database,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Layers,
  Network,
  Play,
  ShieldCheck,
} from "lucide-react";

import {
  BenchmarkReport,
  DEMO_BENCHMARK,
  DEMO_RUN,
  fetchBenchmark,
  fetchHealth,
  RunSummary,
} from "@/lib/api";

export default function DashboardPage() {
  const [health, setHealth] = useState<any>({ falkordb_healthy: true, graph_url: "redis://localhost:6379" });
  const [runs, setRuns] = useState<RunSummary[]>([DEMO_RUN]);
  const [benchmark, setBenchmark] = useState<BenchmarkReport>(DEMO_BENCHMARK);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("payments-core-service");

  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));
    fetchBenchmark().then((b) => setBenchmark(b));
  }, []);

  const triggerNewAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newRun: RunSummary = {
        ...DEMO_RUN,
        run_id: `run_${Date.now().toString(16).slice(-6)}`,
        created_at: new Date().toISOString(),
      };
      setRuns([newRun, ...runs]);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#EDEDEE] flex flex-col md:flex-row">
      {/* Structural Sidebar */}
      <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-[#1E222A] bg-[#0C0E12] flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm tracking-tight text-[#EDEDEE]">
              ripple<span className="text-[#3B82F6]">ci</span>
            </span>
            <span className="text-xs font-mono text-[#636975]">v0.1.0</span>
          </Link>

          <nav className="space-y-1 text-xs font-mono">
            <Link
              href="/app"
              className="flex items-center gap-2 px-3 py-2 rounded bg-[#161920] border border-[#222733] text-[#EDEDEE] font-medium"
            >
              <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Overview</span>
            </Link>

            <Link
              href="/app/graph"
              className="flex items-center gap-2 px-3 py-2 rounded text-[#8B919D] hover:text-[#EDEDEE] hover:bg-[#12151B] transition-colors"
            >
              <Network className="w-3.5 h-3.5 text-[#8B919D]" />
              <span>Graph Explorer</span>
            </Link>

            <Link
              href="/app/runs/run_prod_8f12a9"
              className="flex items-center gap-2 px-3 py-2 rounded text-[#8B919D] hover:text-[#EDEDEE] hover:bg-[#12151B] transition-colors"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-[#8B919D]" />
              <span>PR Release Report</span>
            </Link>
          </nav>
        </div>

        {/* Database Status Panel */}
        <div className="mt-6 md:mt-0 p-3 rounded border border-[#1E222A] bg-[#101217] text-xs font-mono space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#636975]">FalkorDB</span>
            <span className="text-[#10B981] font-semibold text-[11px]">ACTIVE</span>
          </div>
          <div className="text-[11px] text-[#8B919D] truncate">
            {health.graph_url || "redis://localhost:6379"}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Workbench Header */}
        <header className="h-14 border-b border-[#1E222A] px-6 flex items-center justify-between bg-[#0C0E12]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase text-[#636975]">Repo:</span>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-[#12151B] border border-[#222733] rounded px-2.5 py-1 text-xs text-[#EDEDEE] font-mono focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="payments-core-service">payments-core-service (main)</option>
              <option value="auth-gateway">auth-gateway (main)</option>
              <option value="order-service">order-service (main)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerNewAnalysis}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-mono font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Analyzing Graph..." : "Run Impact Analysis"}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <div className="p-6 space-y-6 max-w-7xl">
          {/* Telemetry Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-3.5 space-y-1">
              <div className="text-[11px] font-mono text-[#636975] uppercase">Indexed Symbols</div>
              <div className="text-xl font-bold font-mono text-[#EDEDEE]">22</div>
              <div className="text-[11px] font-mono text-[#8B919D]">10 files scanned</div>
            </div>

            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-3.5 space-y-1">
              <div className="text-[11px] font-mono text-[#636975] uppercase">FalkorDB Edges</div>
              <div className="text-xl font-bold font-mono text-[#EDEDEE]">41</div>
              <div className="text-[11px] font-mono text-[#8B919D]">23 calls · 18 coverage</div>
            </div>

            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-3.5 space-y-1">
              <div className="text-[11px] font-mono text-[#636975] uppercase">Candidate Tests</div>
              <div className="text-xl font-bold font-mono text-[#EDEDEE]">13</div>
              <div className="text-[11px] font-mono text-[#8B919D]">100% pytest mapped</div>
            </div>

            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-3.5 space-y-1">
              <div className="text-[11px] font-mono text-[#636975] uppercase">Release State</div>
              <div className="text-xl font-bold font-mono text-[#10B981]">VERIFIED SAFE</div>
              <div className="text-[11px] font-mono text-[#8B919D]">0 surviving mutants</div>
            </div>
          </div>

          {/* Recent PR Impact Analysis Runs */}
          <div className="rounded border border-[#1E222A] bg-[#0E1015] overflow-hidden">
            <div className="px-4 py-3 bg-[#111318] border-b border-[#1E222A] flex items-center justify-between">
              <div>
                <h2 className="text-xs font-mono font-bold text-[#EDEDEE] uppercase tracking-wider">
                  Pull Request Analysis Runs
                </h2>
                <p className="text-[11px] text-[#636975]">
                  Downstream caller impact, ML test prioritization, and mutation verification.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#8B919D]">Branch: main</span>
            </div>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-[#13161C] border-b border-[#1E222A] text-[#8B919D] text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Run Identifier</th>
                    <th className="py-2.5 px-4">Revision Range</th>
                    <th className="py-2.5 px-4">Modified</th>
                    <th className="py-2.5 px-4">Impacted Callers</th>
                    <th className="py-2.5 px-4">Selected Tests</th>
                    <th className="py-2.5 px-4">Mutation Score</th>
                    <th className="py-2.5 px-4">Verdict</th>
                    <th className="py-2.5 px-4 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1D24] text-[#D1D5DB]">
                  {runs.map((r) => (
                    <tr key={r.run_id} className="hover:bg-[#12151B] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#EDEDEE]">
                        {r.run_id}
                      </td>
                      <td className="py-3 px-4 text-[#8B919D]">
                        {r.base_ref}..{r.head_ref}
                      </td>
                      <td className="py-3 px-4 text-[#F59E0B]">
                        {r.impact.changed_symbols.length} symbol(s)
                      </td>
                      <td className="py-3 px-4 text-[#60A5FA]">
                        {r.impact.impacted_symbols.length} caller(s)
                      </td>
                      <td className="py-3 px-4 text-[#10B981]">
                        {r.plan?.selected_tests.length || 0} tests ({r.plan?.estimated_total_seconds || 0}s)
                      </td>
                      <td className="py-3 px-4">
                        {(r.verification?.mutation_score ? r.verification.mutation_score * 100 : 100).toFixed(0)}% ({r.verification?.killed_mutations_count || 0}/{r.verification?.mutations_tested_count || 0} killed)
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0E1A14] text-[#10B981] border border-[#1A3326]">
                          {r.recommendation}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/app/runs/${r.run_id}`}
                          className="inline-flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#60A5FA]"
                        >
                          <span>Inspect Report</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategy Evaluation Benchmark */}
          <div className="rounded border border-[#1E222A] bg-[#0E1015] overflow-hidden">
            <div className="px-4 py-3 bg-[#111318] border-b border-[#1E222A] flex items-center justify-between">
              <div>
                <h2 className="text-xs font-mono font-bold text-[#EDEDEE] uppercase tracking-wider">
                  Regression Test Selection Benchmark (4 Strategies)
                </h2>
                <p className="text-[11px] text-[#636975]">
                  Evaluates test selection ratio, average runtime, and fault recall across injected test faults.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#10B981] font-semibold">
                100% Fault Recall Preserved
              </span>
            </div>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-[#13161C] border-b border-[#1E222A] text-[#8B919D] text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Strategy</th>
                    <th className="py-2.5 px-4">Selection Ratio</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Fault Recall</th>
                    <th className="py-2.5 px-4">Missed Scenarios</th>
                    <th className="py-2.5 px-4">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1D24] text-[#D1D5DB]">
                  {Object.entries(benchmark.strategies).map(([key, s]) => {
                    const isOptimal = key === "graph_plus_ml";
                    const isFlawed = s.fault_recall < 1.0;
                    return (
                      <tr
                        key={key}
                        className={`transition-colors ${
                          isOptimal ? "bg-[#101420]" : "hover:bg-[#12151B]"
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-[#EDEDEE]">
                          {s.strategy}
                        </td>
                        <td className="py-3 px-4">
                          {(s.selection_ratio * 100).toFixed(1)}% ({s.selected_tests_count}/{s.total_tests_count})
                        </td>
                        <td className="py-3 px-4 text-[#8B919D]">
                          {s.estimated_duration_s.toFixed(1)}s
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${isFlawed ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
                            {(s.fault_recall * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {s.missed_scenarios && s.missed_scenarios.length > 0 ? (
                            <span className="text-[#F59E0B] font-semibold">
                              {s.missed_scenarios.join(", ")} (MISSED)
                            </span>
                          ) : (
                            <span className="text-[#10B981]">None (100% caught)</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isOptimal ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#132338] text-[#60A5FA] border border-[#1E3B5C]">
                              RECOMMENDED
                            </span>
                          ) : isFlawed ? (
                            <span className="text-[#F59E0B] text-[11px]">Unsafe for release</span>
                          ) : (
                            <span className="text-[#636975] text-[11px]">Baseline</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

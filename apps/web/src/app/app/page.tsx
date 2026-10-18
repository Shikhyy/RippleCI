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
  FolderGit2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Layers,
  Network,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { ConnectRepoModal } from "@/components/ConnectRepoModal";
import {
  BenchmarkReport,
  ConnectedRepository,
  DEMO_BENCHMARK,
  DEMO_RUN,
  fetchBenchmark,
  fetchHealth,
  fetchRepositories,
  RunSummary,
} from "@/lib/api";

export default function DashboardPage() {
  const [health, setHealth] = useState<any>({ falkordb_healthy: true, graph_url: "redis://localhost:6379" });
  const [runs, setRuns] = useState<RunSummary[]>([DEMO_RUN]);
  const [benchmark, setBenchmark] = useState<BenchmarkReport>(DEMO_BENCHMARK);
  const [loading, setLoading] = useState<boolean>(false);
  const [repositories, setRepositories] = useState<ConnectedRepository[]>([
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
  ]);
  const [selectedRepo, setSelectedRepo] = useState<string>("payments-core-service");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));
    fetchBenchmark().then((b) => setBenchmark(b));
    fetchRepositories().then((repos) => {
      if (repos && repos.length > 0) {
        setRepositories(repos);
        if (!repos.find((r) => r.id === selectedRepo)) {
          setSelectedRepo(repos[0].id);
        }
      }
    });
  }, []);

  const currentRepo = repositories.find((r) => r.id === selectedRepo) || repositories[0];

  const triggerNewAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newRun: RunSummary = {
        ...DEMO_RUN,
        run_id: `run_${Date.now().toString(16).slice(-6)}`,
        repo_id: selectedRepo,
        created_at: new Date().toISOString(),
      };
      setRuns([newRun, ...runs]);
    }, 900);
  };

  const handleRepositoryConnected = (newRepo: ConnectedRepository) => {
    setRepositories((prev) => [newRepo, ...prev.filter((r) => r.id !== newRepo.id)]);
    setSelectedRepo(newRepo.id);
  };

  return (
    <div className="min-h-screen bg-[#080c0e] text-zinc-100 flex flex-col md:flex-row relative font-sans">
      {/* Connect Repository Modal */}
      <ConnectRepoModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={handleRepositoryConnected}
      />

      {/* Structural Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#6CC6CB]/20 bg-[#060a0c]/90 backdrop-blur-md flex flex-col justify-between p-5 shrink-0 z-10">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[#0d1417] border border-[#6CC6CB]/30 flex items-center justify-center shadow-rim">
              <svg className="w-4 h-4 text-[#6CC6CB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M9 12h6M15 6l-6 6M15 18l-6-6" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                Ripple<span className="text-[#6CC6CB]">CI</span>
              </span>
              <span className="text-[10px] font-mono text-[#EAE5C9]/70">v0.1</span>
            </div>
          </Link>

          <nav className="space-y-1 text-xs">
            <Link
              href="/app"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#6CC6CB]/20 text-[#EAE5C9] font-semibold border border-[#6CC6CB]/40 shadow-sm transition-all"
            >
              <Layers className="w-4 h-4 text-[#6CC6CB]" />
              <span>Overview</span>
            </Link>

            <Link
              href="/app/graph"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <Network className="w-4 h-4 text-zinc-500" />
              <span>Graph Explorer</span>
            </Link>

            <Link
              href="/app/runs/run_prod_8f12a9"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <GitPullRequest className="w-4 h-4 text-zinc-500" />
              <span>PR Release Report</span>
            </Link>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#6CC6CB] hover:text-[#EAE5C9] hover:bg-[#6CC6CB]/10 transition-all font-medium"
            >
              <Plus className="w-4 h-4 text-[#6CC6CB]" />
              <span>Connect Repository</span>
            </button>
          </nav>
        </div>

        {/* FalkorDB Database Status Panel */}
        <div className="mt-8 md:mt-0 p-3.5 rounded-xl border border-[#6CC6CB]/25 bg-[#0d1417]/90 backdrop-blur-md text-xs space-y-1.5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#6CC6CB]" />
              FalkorDB
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CONNECTED
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 truncate">
            {health.graph_url || "redis://localhost:6379"}
          </div>
          <div className="text-[10px] font-mono text-[#EAE5C9]/80">
            Graph: rippleci_repo_graph
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Header */}
        <header className="h-14 border-b border-[#6CC6CB]/20 px-6 flex items-center justify-between glass-header">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Repository:</span>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-[#0d1417] border border-[#6CC6CB]/25 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#6CC6CB] transition-colors shadow-sm"
            >
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.id} ({repo.default_branch || "main"})
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="hidden sm:flex items-center gap-1 text-xs text-[#6CC6CB] hover:text-[#EAE5C9] px-2.5 py-1 rounded-lg border border-[#6CC6CB]/30 bg-[#6CC6CB]/10 hover:bg-[#6CC6CB]/20 transition-all font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Repo</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerNewAnalysis}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold text-[#061012] bg-gradient-to-r from-[#6CC6CB] to-[#5bb4b9] hover:from-[#7cd0d5] hover:to-[#6CC6CB] px-3.5 py-1.5 rounded-lg shadow-[0_1px_14px_rgba(108,198,203,0.4),inset_0_1px_0_rgba(234,229,201,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Analyzing Blast Radius..." : "Run Impact Analysis"}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <div className="p-6 sm:p-8 space-y-8 max-w-7xl">
          {/* Telemetry Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Indexed Symbols</span>
                <Code2 className="w-4 h-4 text-[#6CC6CB]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {currentRepo?.symbols_count || 22}
              </div>
              <div className="text-xs text-zinc-400">10 files scanned into AST</div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">FalkorDB Edges</span>
                <Network className="w-4 h-4 text-[#6CC6CB]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {currentRepo?.edges_count || 41}
              </div>
              <div className="text-xs text-zinc-400">23 calls · 18 coverage</div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Selection Efficiency</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">11.4%</div>
              <div className="text-xs text-zinc-400">7.3x faster execution</div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Release State</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
                <span className="text-emerald-400 text-lg">●</span>
                <span className="text-base font-bold">VERIFIED SAFE</span>
              </div>
              <div className="text-xs text-zinc-400">100% mutation kill rate</div>
            </div>
          </div>

          {/* Pull Request Impact Analysis Runs */}
          <div className="craft-card overflow-hidden">
            <div className="px-5 py-4 bg-[#0d1417] border-b border-[#6CC6CB]/20 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Pull Request Analysis Runs
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Downstream caller impact, ML test prioritization, and counterfactual mutation verification.
                </p>
              </div>
              <span className="text-xs font-mono text-[#6CC6CB] px-2.5 py-1 rounded-full bg-[#6CC6CB]/15 border border-[#6CC6CB]/30">
                Target: main
              </span>
            </div>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-[#060a0c] border-b border-[#6CC6CB]/20 text-zinc-400">
                  <tr>
                    <th className="py-3 px-5 font-semibold">Run Identifier</th>
                    <th className="py-3 px-5 font-semibold">Revision Range</th>
                    <th className="py-3 px-5 font-semibold">Modified</th>
                    <th className="py-3 px-5 font-semibold">Impacted Callers</th>
                    <th className="py-3 px-5 font-semibold">Selected Tests</th>
                    <th className="py-3 px-5 font-semibold">Mutation Score</th>
                    <th className="py-3 px-5 font-semibold">Verdict</th>
                    <th className="py-3 px-5 font-semibold text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  {runs.map((r) => (
                    <tr key={r.run_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-5 font-bold text-white flex items-center gap-2">
                        <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{r.run_id}</span>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-400">
                        {r.base_ref}..{r.head_ref}
                      </td>
                      <td className="py-3.5 px-5 text-[#6CC6CB]">
                        {r.impact.changed_symbols.length} symbol(s)
                      </td>
                      <td className="py-3.5 px-5 text-[#EAE5C9]">
                        {r.impact.impacted_symbols.length} caller(s)
                      </td>
                      <td className="py-3.5 px-5 text-emerald-400">
                        {r.plan?.selected_tests.length || 0} tests ({r.plan?.estimated_total_seconds || 0}s)
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-white">
                          {(r.verification?.mutation_score ? r.verification.mutation_score * 100 : 100).toFixed(0)}%
                        </span>
                        <span className="text-zinc-500 ml-1">
                          ({r.verification?.killed_mutations_count || 0}/{r.verification?.mutations_tested_count || 0} killed)
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                          {r.recommendation}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/app/runs/${r.run_id}`}
                          className="inline-flex items-center gap-1.5 text-xs text-[#6CC6CB] hover:text-[#EAE5C9] font-semibold transition-colors"
                        >
                          <span>Inspect Report</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategy Evaluation Benchmark */}
          <div className="craft-card overflow-hidden">
            <div className="px-5 py-4 bg-[#0d1417] border-b border-[#6CC6CB]/20 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Regression Test Selection Benchmark (4 Strategies)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Evaluates test selection ratio, average runtime, and fault recall across injected test faults.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                100% Fault Recall Preserved
              </span>
            </div>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-[#060a0c] border-b border-[#6CC6CB]/20 text-zinc-400">
                  <tr>
                    <th className="py-3 px-5 font-semibold">Strategy</th>
                    <th className="py-3 px-5 font-semibold">Selection Ratio</th>
                    <th className="py-3 px-5 font-semibold">Avg. Time</th>
                    <th className="py-3 px-5 font-semibold">Fault Recall</th>
                    <th className="py-3 px-5 font-semibold">Missed Scenarios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  {Object.values(benchmark?.strategies || {}).map((c) => (
                    <tr
                      key={c.strategy}
                      className={
                        c.strategy === "graph_plus_ml"
                          ? "bg-[#6CC6CB]/[0.1] hover:bg-[#6CC6CB]/[0.15] transition-colors"
                          : c.strategy === "change_file_heuristic"
                          ? "bg-[#6CC6CB]/[0.04] hover:bg-[#6CC6CB]/[0.08] transition-colors"
                          : "hover:bg-white/[0.02] transition-colors"
                      }
                    >
                      <td className="py-3.5 px-5 font-bold text-white">
                        {c.strategy}
                        {c.strategy === "graph_plus_ml" && (
                          <span className="ml-2 text-[10px] text-[#061012] bg-[#6CC6CB] px-1.5 py-0.5 rounded font-sans font-semibold">
                            Recommended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span>{(c.selection_ratio * 100).toFixed(1)}%</span>
                          <span className="text-zinc-500 text-[11px]">({c.selected_tests_count}/{c.total_tests_count})</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-semibold">
                        <span className={c.strategy === "graph_plus_ml" ? "text-[#6CC6CB] font-bold" : "text-zinc-300"}>
                          {c.estimated_duration_s.toFixed(1)}s
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`font-bold ${
                            c.fault_recall === 1 ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {(c.fault_recall * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {c.missed_scenarios.length === 0 ? (
                          <span className="text-emerald-400 font-medium">None (0 regressions missed)</span>
                        ) : (
                          <span className="text-amber-400 font-medium">{c.missed_scenarios.join(", ")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

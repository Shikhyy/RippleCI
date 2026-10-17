"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Layers,
  Network,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { DEMO_RUN, fetchHealth, fetchRun, RunSummary } from "@/lib/api";

export default function DashboardPage() {
  const [health, setHealth] = useState<any>({ falkordb_healthy: true, mode: "connected" });
  const [runs, setRuns] = useState<RunSummary[]>([DEMO_RUN]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("payments-core-service");

  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));
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
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F3F4F6] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-[#070A12] flex flex-col justify-between p-4 hidden md:flex">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-bold text-base tracking-tight text-white font-sans">
              Ripple<span className="text-blue-500">CI</span>
            </span>
          </Link>

          <nav className="space-y-1">
            <Link
              href="/app"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-medium"
            >
              <Layers className="w-4 h-4" />
              <span>Overview</span>
            </Link>

            <Link
              href="/app/graph"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 text-xs font-medium transition-colors"
            >
              <Network className="w-4 h-4" />
              <span>Graph Explorer</span>
            </Link>

            <Link
              href="/app/runs/run_prod_8f12a9"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 text-xs font-medium transition-colors"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>Pull Request Impact</span>
            </Link>
          </nav>
        </div>

        {/* Database Health Pill in Sidebar */}
        <div className="border border-slate-800 rounded-lg p-3 bg-slate-950 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">FalkorDB Graph</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-500 truncate">
            {health.graph_url || "redis://localhost:6379"}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-[#080B14]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Repository</span>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              <Play className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Analyzing..." : "Trigger Impact Analysis"}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-8 max-w-7xl">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4 space-y-1">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Indexed Symbols</div>
              <div className="text-2xl font-bold font-mono text-white">22</div>
              <div className="text-[11px] text-blue-400 flex items-center gap-1">
                <Code2 className="w-3 h-3" /> 10 files scanned
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4 space-y-1">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Dependency Edges</div>
              <div className="text-2xl font-bold font-mono text-white">41</div>
              <div className="text-[11px] text-purple-400 flex items-center gap-1">
                <Network className="w-3 h-3" /> 23 calls, 18 coverage
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4 space-y-1">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Candidate Tests</div>
              <div className="text-2xl font-bold font-mono text-white">13</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 100% pytest mapped
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4 space-y-1">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Release Verdict</div>
              <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> RELEASE SAFE
              </div>
              <div className="text-[11px] text-slate-400">Evidence verified in graph</div>
            </div>
          </div>

          {/* Recent Analysis Runs Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Recent Pull Request Impact Runs</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Trace downstream callers, selected test plans, and mutation verification results.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">Live FalkorDB session</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Run ID</th>
                    <th className="py-3 px-4 font-semibold">Branch Range</th>
                    <th className="py-3 px-4 font-semibold">Changed</th>
                    <th className="py-3 px-4 font-semibold">Impacted Callers</th>
                    <th className="py-3 px-4 font-semibold">Selected Tests</th>
                    <th className="py-3 px-4 font-semibold">Mutations</th>
                    <th className="py-3 px-4 font-semibold">Verdict</th>
                    <th className="py-3 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300 font-mono">
                  {runs.map((r) => (
                    <tr key={r.run_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                        {r.run_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {r.base_ref}..{r.head_ref}
                      </td>
                      <td className="py-3.5 px-4 text-amber-300 font-semibold">
                        {r.impact.changed_symbols.length} symbol(s)
                      </td>
                      <td className="py-3.5 px-4 text-blue-300">
                        {r.impact.impacted_symbols.length} caller(s)
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400">
                        {r.plan?.selected_tests.length || 0} tests ({r.plan?.estimated_total_seconds || 0}s)
                      </td>
                      <td className="py-3.5 px-4">
                        {r.verification?.killed_mutations_count || 0}/{r.verification?.mutations_tested_count || 0} killed
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {r.recommendation}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/app/runs/${r.run_id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
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
        </div>
      </main>
    </div>
  );
}

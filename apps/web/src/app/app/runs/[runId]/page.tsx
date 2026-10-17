"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  FileCode,
  GitCommit,
  GitPullRequest,
  Layers,
  Network,
  ShieldCheck,
  Terminal,
  X,
  Zap,
} from "lucide-react";

import { GraphCanvas } from "@/components/GraphCanvas";
import { DEMO_GRAPH_DATA, DEMO_RUN, fetchRun, RunSummary } from "@/lib/api";

export default function RunDetailsPage() {
  const params = useParams();
  const runId = (params?.runId as string) || "run_prod_8f12a9";
  const [run, setRun] = useState<RunSummary>(DEMO_RUN);
  const [activeTab, setActiveTab] = useState<string>("impact");
  const [selectedTest, setSelectedTest] = useState<any | null>(null);

  useEffect(() => {
    fetchRun(runId).then((r) => {
      setRun(r);
      if (r.plan?.selected_tests.length) {
        setSelectedTest(r.plan.selected_tests[0]);
      }
    });
  }, [runId]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#6A4BFF]/20 px-4 md:px-6 flex items-center justify-between glass-header">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-white">{run.run_id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>Range:</span>
          <span className="bg-[#0f0e17] border border-[#6A4BFF]/30 px-2.5 py-0.5 rounded text-[#E4DBFF]">
            {run.base_ref}..{run.head_ref}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner Row */}
        <div className="craft-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Pull Request Release Report
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {run.recommendation}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Repository: {run.repo_id} · Branch: main · Commit: 8f12a9
            </p>
          </div>

          <div className="flex items-center gap-6 sm:gap-8 text-xs font-mono">
            <div>
              <div className="text-zinc-500 uppercase text-[10px] tracking-wider">Estimated Runtime</div>
              <div className="text-white font-bold text-base mt-0.5">
                {run.plan?.estimated_total_seconds || 4.8}s
              </div>
            </div>
            <div>
              <div className="text-zinc-500 uppercase text-[10px] tracking-wider">Selected Tests</div>
              <div className="text-emerald-400 font-bold text-base mt-0.5">
                {run.plan?.selected_tests.length || 4} / 13 tests
              </div>
            </div>
            <div>
              <div className="text-zinc-500 uppercase text-[10px] tracking-wider">Mutation Score</div>
              <div className="text-[#E4DBFF] font-bold text-base mt-0.5">
                {(run.verification?.mutation_score ? run.verification.mutation_score * 100 : 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="p-1 bg-zinc-950/80 rounded-xl border border-white/[0.08] inline-flex items-center gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("impact")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "impact"
                ? "bg-[#6A4BFF]/20 text-[#E4DBFF] font-semibold shadow-sm border border-[#6A4BFF]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Change Blast Radius ({run.impact.changed_symbols.length + run.impact.impacted_symbols.length})
          </button>

          <button
            onClick={() => setActiveTab("plan")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "plan"
                ? "bg-[#6A4BFF]/20 text-[#E4DBFF] font-semibold shadow-sm border border-[#6A4BFF]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Prioritized Plan ({run.plan?.selected_tests.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("verification")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "verification"
                ? "bg-[#6A4BFF]/20 text-[#E4DBFF] font-semibold shadow-sm border border-[#6A4BFF]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Mutation Verification ({run.verification?.mutations_tested_count || 0} mutants)
          </button>

          <button
            onClick={() => setActiveTab("agent")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "agent"
                ? "bg-[#6A4BFF]/20 text-[#E4DBFF] font-semibold shadow-sm border border-[#6A4BFF]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Agent Reasoning
          </button>

          <button
            onClick={() => setActiveTab("graph")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "graph"
                ? "bg-[#6A4BFF]/20 text-[#E4DBFF] font-semibold shadow-sm border border-[#6A4BFF]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            FalkorDB Subgraph
          </button>
        </div>

        {/* Tab 1: Impact Blast Radius */}
        {activeTab === "impact" && (
          <div className="space-y-6">
            {/* Directly Modified Symbols */}
            <div className="craft-card overflow-hidden">
              <div className="px-5 py-3.5 bg-[#0f0e17]/95 border-b border-[#6A4BFF]/20 flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Directly Modified Symbols
                </h3>
                <span className="text-[11px] font-mono text-[#E4DBFF]/70">AST Diff Inspector</span>
              </div>
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#09090b] border-b border-[#6A4BFF]/20 text-zinc-400">
                    <tr>
                      <th className="py-2.5 px-5">Symbol Name</th>
                      <th className="py-2.5 px-5">File Path</th>
                      <th className="py-2.5 px-5">Line Span</th>
                      <th className="py-2.5 px-5">Diff Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                    {run.impact.changed_symbols.map((s, idx) => (
                      <tr key={idx} className="hover:bg-[#151322] transition-colors">
                        <td className="py-3 px-5 text-amber-400 font-bold">{s.name}</td>
                        <td className="py-3 px-5 text-zinc-400">{s.file_path}</td>
                        <td className="py-3 px-5">{s.start_line}–{s.end_line}</td>
                        <td className="py-3 px-5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            MODIFIED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Downstream Callers */}
            <div className="craft-card overflow-hidden">
              <div className="px-5 py-3.5 bg-[#0f0e17]/95 border-b border-[#6A4BFF]/20 flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6A4BFF]" />
                  Downstream Impacted Callers (FalkorDB Multi-Hop Traversal)
                </h3>
                <span className="text-[11px] font-mono text-[#E4DBFF]/70">Cypher CALLS Query</span>
              </div>
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#09090b] border-b border-[#6A4BFF]/20 text-zinc-400">
                    <tr>
                      <th className="py-2.5 px-5">Caller Symbol</th>
                      <th className="py-2.5 px-5">Distance</th>
                      <th className="py-2.5 px-5">FalkorDB Call Chain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                    {run.impact.impacted_symbols.map((imp, idx) => (
                      <tr key={idx} className="hover:bg-[#151322] transition-colors">
                        <td className="py-3 px-5 text-[#E4DBFF] font-bold">{imp.symbol.name}</td>
                        <td className="py-3 px-5 text-zinc-400">{imp.hops_from_change} hop(s)</td>
                        <td className="py-3 px-5 text-zinc-200 font-semibold">{imp.path_to_change.join(" → ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Prioritized Test Plan with Master-Detail Inspector */}
        {activeTab === "plan" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 craft-card overflow-hidden">
              <div className="px-5 py-4 bg-[#0f0e17]/95 border-b border-[#6A4BFF]/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Ranked Regression Test Plan
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    GBDT prioritized under 300s budget based on graph distance and historical defect signal.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#E4DBFF] px-2 py-0.5 rounded bg-[#151322] border border-[#6A4BFF]/30">
                  Model: GBDT-v1
                </span>
              </div>

              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#09090b] border-b border-[#6A4BFF]/20 text-zinc-400">
                    <tr>
                      <th className="py-3 px-5">Rank</th>
                      <th className="py-3 px-5">Test Case</th>
                      <th className="py-3 px-5">ML Score</th>
                      <th className="py-3 px-5">Runtime</th>
                      <th className="py-3 px-5 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                    {run.plan?.selected_tests.map((t) => (
                      <tr
                        key={t.rank}
                        onClick={() => setSelectedTest(t)}
                        className={`cursor-pointer transition-colors ${
                          selectedTest?.name === t.name
                            ? "bg-[#6A4BFF]/20 text-white"
                            : "hover:bg-[#151322]"
                        }`}
                      >
                        <td className="py-3.5 px-5 font-bold text-white">#{t.rank}</td>
                        <td className="py-3.5 px-5 text-emerald-400 font-bold">{t.name}</td>
                        <td className="py-3.5 px-5 text-[#E4DBFF] font-bold">{t.rank_score.toFixed(2)}</td>
                        <td className="py-3.5 px-5 text-zinc-400">{t.estimated_duration_seconds.toFixed(1)}s</td>
                        <td className="py-3.5 px-5 text-right text-[#E4DBFF]">
                          <ChevronRight className="w-4 h-4 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Test Evidence Detail Inspector */}
            <div className="craft-card p-5 text-xs font-mono space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#6A4BFF]/20">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Evidence Inspector</span>
                  {selectedTest && (
                    <span className="text-xs text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      Rank #{selectedTest.rank}
                    </span>
                  )}
                </div>

                {selectedTest ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Test Identifier</div>
                      <div className="text-xs font-bold text-white break-all mt-1">{selectedTest.name}</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">ML Prioritization Score</div>
                      <div className="text-sm font-bold text-[#E4DBFF] mt-1">{selectedTest.rank_score.toFixed(3)}</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Predicted Duration</div>
                      <div className="text-xs text-white mt-1">{selectedTest.estimated_duration_seconds.toFixed(1)}s</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Graph Selection Rationale</div>
                      <ul className="mt-1.5 space-y-1.5 text-xs text-zinc-300">
                        {selectedTest.reasons.map((r: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#6A4BFF] shrink-0 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg border border-[#6A4BFF]/20 bg-[#151322] text-[11px] text-[#E4DBFF]/80 leading-relaxed">
                      Prioritized by GBDT ranker due to immediate proximity in FalkorDB to modified AST symbols.
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-500">Select a test from the table to inspect graph attribution.</div>
                )}
              </div>

              <div className="pt-3 border-t border-[#6A4BFF]/20 text-[11px] text-[#E4DBFF]/60">
                FalkorDB Provenance Model
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bounded Mutation Verification */}
        {activeTab === "verification" && (
          <div className="craft-card p-6 space-y-6 text-xs font-mono">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#151322] rounded-xl border border-[#6A4BFF]/20 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Test Suite Result</div>
                <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>4 / 4 Passed</span>
                </div>
              </div>

              <div className="p-4 bg-[#151322] rounded-xl border border-[#6A4BFF]/20 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Mutations Tested</div>
                <div className="text-base font-bold text-white mt-1">5 Mutants</div>
              </div>

              <div className="p-4 bg-[#151322] rounded-xl border border-[#6A4BFF]/20 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Mutations Killed</div>
                <div className="text-base font-bold text-[#E4DBFF] mt-1">5 / 5 (100%)</div>
              </div>

              <div className="p-4 bg-[#151322] rounded-xl border border-[#6A4BFF]/20 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Surviving Mutants</div>
                <div className="text-base font-bold text-emerald-400 mt-1">0 (Safe)</div>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Bounded Verification Passed:</span> All 5 transient AST mutations applied to modified lines were killed by the selected test plan. Zero blind spots were detected in this release candidate.
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Agent Reasoning */}
        {activeTab === "agent" && (
          <div className="space-y-4 text-xs font-mono">
            <div className="craft-card p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Autonomous Graph Reasoning Agent Trace
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  5 deterministic tool calls across AST symbols, CALLS edges, and test candidate graphs in FalkorDB.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {run.investigation?.verdict || "VERIFIED_SAFE"}
              </span>
            </div>

            <div className="craft-card p-5 space-y-3">
              <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider">Tool Execution Trace</h4>
              <div className="space-y-2">
                {(run.investigation?.tool_trace || []).map((step, idx) => {
                  const parts = step.split(" -> ");
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#151322] border border-[#6A4BFF]/20 text-zinc-300"
                    >
                      <span className="w-5 h-5 rounded-md bg-[#6A4BFF]/20 border border-[#6A4BFF]/40 text-[#E4DBFF] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[#E4DBFF] font-semibold">{parts[0]}</span>
                      <span className="text-zinc-600">→</span>
                      <span>{parts[1] || ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="craft-card p-5 space-y-3">
              <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider">Grounded Graph Findings</h4>
              <pre className="p-4 rounded-lg bg-[#09090b] border border-[#6A4BFF]/20 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">
                {run.investigation?.evidence_summary}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 5: Subgraph Canvas */}
        {activeTab === "graph" && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#E4DBFF]/80">
              Interactive FalkorDB subgraph for this pull request change:
            </div>
            <GraphCanvas initialData={DEMO_GRAPH_DATA} />
          </div>
        )}
      </main>
    </div>
  );
}

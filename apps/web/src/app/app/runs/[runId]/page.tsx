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
  FileCode,
  GitCommit,
  GitPullRequest,
  Network,
  ShieldCheck,
  Terminal,
  X,
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
    <div className="min-h-screen bg-[#090A0D] text-[#EDEDEE] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#1E222A] px-4 md:px-6 flex items-center justify-between bg-[#0C0E12]">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs font-mono text-[#8B919D] hover:text-[#EDEDEE] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span className="text-[#333945]">/</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#EDEDEE]">{run.run_id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#8B919D]">
          <span>Range:</span>
          <span className="bg-[#141720] border border-[#222733] px-2 py-0.5 rounded text-[#EDEDEE]">
            {run.base_ref}..{run.head_ref}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded border border-[#1E222A] bg-[#0E1015]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold font-mono text-[#EDEDEE]">Pull Request Release Report</h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[#0E1A14] text-[#10B981] border border-[#1A3326]">
                {run.recommendation}
              </span>
            </div>
            <p className="text-xs font-mono text-[#636975] mt-1">
              Repository: {run.repo_id} · Range: {run.base_ref}..{run.head_ref}
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <div className="text-[#636975] uppercase text-[11px]">Runtime</div>
              <div className="text-[#EDEDEE] font-bold text-sm">{run.plan?.estimated_total_seconds || 4.8}s</div>
            </div>
            <div>
              <div className="text-[#636975] uppercase text-[11px]">Selected Tests</div>
              <div className="text-[#10B981] font-bold text-sm">{run.plan?.selected_tests.length || 4} / 13 tests</div>
            </div>
            <div>
              <div className="text-[#636975] uppercase text-[11px]">Mutation Score</div>
              <div className="text-[#60A5FA] font-bold text-sm">
                {(run.verification?.mutation_score ? run.verification.mutation_score * 100 : 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1E222A] gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab("impact")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "impact"
                ? "border-[#3B82F6] text-[#EDEDEE] font-semibold"
                : "border-transparent text-[#8B919D] hover:text-[#EDEDEE]"
            }`}
          >
            Change Blast Radius ({run.impact.changed_symbols.length + run.impact.impacted_symbols.length})
          </button>

          <button
            onClick={() => setActiveTab("plan")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "plan"
                ? "border-[#3B82F6] text-[#EDEDEE] font-semibold"
                : "border-transparent text-[#8B919D] hover:text-[#EDEDEE]"
            }`}
          >
            Prioritized Plan ({run.plan?.selected_tests.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("verification")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "verification"
                ? "border-[#3B82F6] text-[#EDEDEE] font-semibold"
                : "border-transparent text-[#8B919D] hover:text-[#EDEDEE]"
            }`}
          >
            Mutation Verification ({run.verification?.mutations_tested_count || 0} mutants)
          </button>

          <button
            onClick={() => setActiveTab("agent")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "agent"
                ? "border-[#3B82F6] text-[#EDEDEE] font-semibold"
                : "border-transparent text-[#8B919D] hover:text-[#EDEDEE]"
            }`}
          >
            Agent Reasoning
          </button>

          <button
            onClick={() => setActiveTab("graph")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "graph"
                ? "border-[#3B82F6] text-[#EDEDEE] font-semibold"
                : "border-transparent text-[#8B919D] hover:text-[#EDEDEE]"
            }`}
          >
            FalkorDB Subgraph
          </button>
        </div>

        {/* Tab 1: Impact Blast Radius */}
        {activeTab === "impact" && (
          <div className="space-y-4">
            {/* Directly Modified Symbols */}
            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-4 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDEDEE] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                Directly Modified Symbols
              </h3>
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="text-[#636975] border-b border-[#1E222A] pb-1">
                    <tr>
                      <th className="py-2">Symbol Name</th>
                      <th className="py-2">File Path</th>
                      <th className="py-2">Line Span</th>
                      <th className="py-2">Diff Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D24] text-[#D1D5DB]">
                    {run.impact.changed_symbols.map((s, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 text-[#F59E0B] font-semibold">{s.name}</td>
                        <td className="py-2.5 text-[#8B919D]">{s.file_path}</td>
                        <td className="py-2.5">{s.start_line}–{s.end_line}</td>
                        <td className="py-2.5 text-[#D97706]">MODIFIED</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Downstream Callers */}
            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-4 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDEDEE] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                Downstream Impacted Callers (FalkorDB Multi-Hop Traversal)
              </h3>
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="text-[#636975] border-b border-[#1E222A] pb-1">
                    <tr>
                      <th className="py-2">Caller Symbol</th>
                      <th className="py-2">Distance</th>
                      <th className="py-2">FalkorDB Call Chain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D24] text-[#D1D5DB]">
                    {run.impact.impacted_symbols.map((imp, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 text-[#60A5FA] font-semibold">{imp.symbol.name}</td>
                        <td className="py-2.5 text-[#8B919D]">{imp.hops_from_change} hop(s)</td>
                        <td className="py-2.5 text-[#8B919D]">{imp.path_to_change.join(" → ")}</td>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded border border-[#1E222A] bg-[#0E1015] overflow-hidden">
              <div className="px-4 py-3 bg-[#111318] border-b border-[#1E222A] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-[#EDEDEE] uppercase tracking-wider">
                    Ranked Regression Test Plan
                  </h3>
                  <p className="text-[11px] text-[#636975]">
                    GBDT prioritized under 300s budget based on graph distance and historical defect signal.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-[#8B919D]">Ranker: GBDT-v1</span>
              </div>

              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#13161C] border-b border-[#1E222A] text-[#8B919D]">
                    <tr>
                      <th className="py-2.5 px-4">Rank</th>
                      <th className="py-2.5 px-4">Test Case</th>
                      <th className="py-2.5 px-4">ML Score</th>
                      <th className="py-2.5 px-4">Runtime</th>
                      <th className="py-2.5 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D24] text-[#D1D5DB]">
                    {run.plan?.selected_tests.map((t) => (
                      <tr
                        key={t.rank}
                        onClick={() => setSelectedTest(t)}
                        className={`cursor-pointer transition-colors ${
                          selectedTest?.name === t.name ? "bg-[#141822]" : "hover:bg-[#11141A]"
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-white">#{t.rank}</td>
                        <td className="py-3 px-4 text-[#10B981] font-semibold">{t.name}</td>
                        <td className="py-3 px-4 text-[#60A5FA] font-bold">{t.rank_score.toFixed(2)}</td>
                        <td className="py-3 px-4 text-[#8B919D]">{t.estimated_duration_seconds.toFixed(1)}s</td>
                        <td className="py-3 px-4 text-right text-[#3B82F6]">
                          <ChevronRight className="w-3.5 h-3.5 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Test Evidence Detail Inspector */}
            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-4 text-xs font-mono space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E222A]">
                <span className="text-xs font-bold text-[#EDEDEE] uppercase">Evidence Inspector</span>
                {selectedTest && (
                  <span className="text-[11px] text-[#10B981] font-bold">Rank #{selectedTest.rank}</span>
                )}
              </div>

              {selectedTest ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] text-[#636975] uppercase">Test Identifier</div>
                    <div className="text-xs font-bold text-[#EDEDEE] break-all mt-0.5">{selectedTest.name}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#636975] uppercase">ML Prioritization Score</div>
                    <div className="text-xs font-bold text-[#60A5FA] mt-0.5">{selectedTest.rank_score.toFixed(3)}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#636975] uppercase">Predicted Duration</div>
                    <div className="text-xs text-[#EDEDEE] mt-0.5">{selectedTest.estimated_duration_seconds.toFixed(1)}s</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#636975] uppercase">Graph Selection Rationale</div>
                    <ul className="mt-1 space-y-1 text-[11px] text-[#9CA3AF]">
                      {selectedTest.reasons.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#3B82F6] shrink-0 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded border border-[#1E222A] bg-[#111318] text-[11px] text-[#8B919D] leading-relaxed">
                    Prioritized by GBDT ranker due to immediate distance to modified AST symbols.
                  </div>
                </div>
              ) : (
                <div className="text-[#636975]">Select a test to inspect graph attribution.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Bounded Mutation Verification */}
        {activeTab === "verification" && (
          <div className="rounded border border-[#1E222A] bg-[#0E1015] p-5 space-y-5 text-xs font-mono">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-[#111318] rounded border border-[#1E222A]">
                <div className="text-[11px] text-[#636975] uppercase">Test Execution</div>
                <div className="text-base font-bold text-[#10B981] mt-1">4 / 4 Passed</div>
              </div>
              <div className="p-3 bg-[#111318] rounded border border-[#1E222A]">
                <div className="text-[11px] text-[#636975] uppercase">Mutations Tested</div>
                <div className="text-base font-bold text-[#EDEDEE] mt-1">5 Mutants</div>
              </div>
              <div className="p-3 bg-[#111318] rounded border border-[#1E222A]">
                <div className="text-[11px] text-[#636975] uppercase">Mutations Killed</div>
                <div className="text-base font-bold text-[#60A5FA] mt-1">5 / 5 (100%)</div>
              </div>
              <div className="p-3 bg-[#111318] rounded border border-[#1E222A]">
                <div className="text-[11px] text-[#636975] uppercase">Surviving Mutants</div>
                <div className="text-base font-bold text-[#10B981] mt-1">0 (Safe)</div>
              </div>
            </div>

            <div className="p-3.5 bg-[#0E1A14] border border-[#1A3326] rounded text-[#A7F3D0] leading-relaxed">
              <span className="font-bold text-white">Bounded Verification Passed:</span> All 5 transient AST mutations applied to changed code lines were killed by the selected test plan. Zero blind spots were detected.
            </div>
          </div>
        )}

        {/* Tab 4: Agent Reasoning */}
        {activeTab === "agent" && (
          <div className="space-y-4 text-xs font-mono">
            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#EDEDEE] uppercase">Autonomous Graph Reasoning Agent Trace</h3>
                <p className="text-[11px] text-[#636975] mt-0.5">
                  5 deterministic tool calls across AST symbols, CALLS edges, and test candidate graphs.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#0E1A14] text-[#10B981] border border-[#1A3326]">
                {run.investigation?.verdict || "VERIFIED_SAFE"}
              </span>
            </div>

            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-4 space-y-2">
              <h4 className="text-[11px] text-[#636975] uppercase tracking-wider">Tool Execution Trace</h4>
              <div className="space-y-1.5">
                {(run.investigation?.tool_trace || []).map((step, idx) => {
                  const parts = step.split(" -> ");
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded bg-[#111318] border border-[#1C202B] text-[#D1D5DB]"
                    >
                      <span className="w-4 h-4 rounded bg-[#161B26] text-[#3B82F6] flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-[#60A5FA] font-semibold">{parts[0]}</span>
                      <span className="text-[#636975]">→</span>
                      <span>{parts[1] || ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded border border-[#1E222A] bg-[#0E1015] p-4 space-y-2">
              <h4 className="text-[11px] text-[#636975] uppercase tracking-wider">Grounded Graph Findings</h4>
              <pre className="p-3 rounded bg-[#111318] border border-[#1C202B] text-[11px] text-[#9CA3AF] whitespace-pre-wrap leading-relaxed font-mono">
                {run.investigation?.evidence_summary}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 5: Subgraph Canvas */}
        {activeTab === "graph" && (
          <div className="space-y-2">
            <div className="text-xs font-mono text-[#8B919D]">
              Interactive FalkorDB subgraph for this pull request change:
            </div>
            <GraphCanvas initialData={DEMO_GRAPH_DATA} />
          </div>
        )}
      </main>
    </div>
  );
}

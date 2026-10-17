import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Code, GitCommit, GitPullRequest, Layers, ShieldCheck } from "lucide-react";

import { GraphCanvas } from "@/components/GraphCanvas";
import { Navbar } from "@/components/Navbar";
import { TerminalBlock } from "@/components/TerminalBlock";
import { DEMO_GRAPH_DATA } from "@/lib/api";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090A0D] text-[#EDEDEE]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-14 md:pt-24 md:pb-20 border-b border-[#1E222A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            {/* Header Tag */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#262B35] bg-[#12141A] text-[#8B919D] text-xs font-mono mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
              <span>FalkorDB Connected-Data Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#EDEDEE] leading-[1.12]">
              Graph-native release intelligence for modern test suites.
            </h1>

            <p className="mt-5 text-sm sm:text-base text-[#8B919D] leading-relaxed max-w-2xl">
              RippleCI indexes repository AST call graphs into FalkorDB, traces multi-hop downstream consequences of pull request changes, prioritizes tests with learned ranking models under execution budgets, and verifies plans using bounded mutation testing.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs">
              <Link
                href="/app"
                className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2.5 rounded transition-colors"
              >
                <span>Launch Web Workbench</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/app/graph"
                className="flex items-center gap-1.5 bg-[#12141A] hover:bg-[#181B22] text-[#EDEDEE] border border-[#222733] font-medium px-4 py-2.5 rounded transition-colors"
              >
                <span>Graph Explorer</span>
              </Link>

              <div className="flex items-center gap-2 px-3 py-2 rounded border border-[#1E222A] bg-[#0E1015] text-[#8B919D]">
                <span>pip install rippleci</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Workbench Section */}
      <section className="py-14 border-b border-[#1E222A] bg-[#0B0C10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#3B82F6] font-semibold">
                CLI Developer Workflow
              </span>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#EDEDEE]">
                Autonomous terminal execution
              </h2>
            </div>
            <p className="text-xs text-[#8B919D] font-mono">
              Deterministic outputs · Machine-readable JSON · GitHub Step Summary
            </p>
          </div>

          <TerminalBlock />
        </div>
      </section>

      {/* FalkorDB Graph Canvas Section */}
      <section className="py-14 border-b border-[#1E222A] bg-[#090A0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#3B82F6] font-semibold">
                FalkorDB Subgraph
              </span>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#EDEDEE]">
                Downstream blast radius visualization
              </h2>
              <p className="text-xs text-[#8B919D] mt-1">
                Click any symbol or test to inspect exact line coordinates and caller dependencies.
              </p>
            </div>
            <Link
              href="/app/graph"
              className="text-xs font-mono text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1"
            >
              <span>Full Screen Graph Explorer</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <GraphCanvas initialData={DEMO_GRAPH_DATA} />
        </div>
      </section>

      {/* 4-Step Technical Architecture */}
      <section className="py-14 border-b border-[#1E222A] bg-[#0B0C10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#3B82F6] font-semibold">
              Pipeline Architecture
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#EDEDEE]">
              From code modification to evidence-backed release
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded border border-[#222733] bg-[#0E1015] space-y-2">
              <div className="text-xs font-mono text-[#3B82F6] font-semibold">01. INDEX</div>
              <h3 className="text-sm font-bold text-[#EDEDEE]">AST & Symbol Parsing</h3>
              <p className="text-xs text-[#8B919D] leading-relaxed">
                Parses Python ASTs, resolves internal import targets, and registers function and test case nodes with stable hashes into FalkorDB.
              </p>
            </div>

            <div className="p-4 rounded border border-[#222733] bg-[#0E1015] space-y-2">
              <div className="text-xs font-mono text-[#3B82F6] font-semibold">02. TRAVERSE</div>
              <h3 className="text-sm font-bold text-[#EDEDEE]">FalkorDB Graph Traversal</h3>
              <p className="text-xs text-[#8B919D] leading-relaxed">
                Executes parameterized Cypher queries across incoming CALLS edges to discover indirect, multi-hop callers impacted by the change.
              </p>
            </div>

            <div className="p-4 rounded border border-[#222733] bg-[#0E1015] space-y-2">
              <div className="text-xs font-mono text-[#3B82F6] font-semibold">03. RANK</div>
              <h3 className="text-sm font-bold text-[#EDEDEE]">Learned Prioritization</h3>
              <p className="text-xs text-[#8B919D] leading-relaxed">
                Gradient boosted decision trees rank candidate tests by graph proximity, churn, coverage overlap, and failure probability under budget.
              </p>
            </div>

            <div className="p-4 rounded border border-[#222733] bg-[#0E1015] space-y-2">
              <div className="text-xs font-mono text-[#3B82F6] font-semibold">04. VERIFY</div>
              <h3 className="text-sm font-bold text-[#EDEDEE]">Counterfactual Verification</h3>
              <p className="text-xs text-[#8B919D] leading-relaxed">
                Injects transient AST mutations into modified lines to verify the selected test plan catches injected faults before release approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benchmark Matrix */}
      <section className="py-14 border-b border-[#1E222A] bg-[#090A0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-[#3B82F6] font-semibold">
              Evaluation & Benchmarks
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#EDEDEE]">
              Comparing 4 regression selection strategies
            </h2>
            <p className="mt-1 text-xs text-[#8B919D]">
              Evaluated across fault injection scenarios on real multi-hop services.
            </p>
          </div>

          <div className="rounded border border-[#222733] bg-[#0E1015] overflow-hidden text-xs font-mono">
            <table className="w-full text-left">
              <thead className="bg-[#13161C] border-b border-[#222733] text-[#8B919D]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Strategy</th>
                  <th className="py-3 px-4 font-semibold">Selection Ratio</th>
                  <th className="py-3 px-4 font-semibold">Avg. Duration</th>
                  <th className="py-3 px-4 font-semibold">Fault Recall</th>
                  <th className="py-3 px-4 font-semibold">Missed Scenarios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C202B] text-[#D1D5DB]">
                <tr>
                  <td className="py-3 px-4 font-bold text-white">full_suite</td>
                  <td className="py-3 px-4">100.0% (41/41)</td>
                  <td className="py-3 px-4 text-[#8B919D]">41.0s</td>
                  <td className="py-3 px-4 text-[#10B981] font-bold">100.0%</td>
                  <td className="py-3 px-4 text-[#10B981]">None (baseline)</td>
                </tr>
                <tr className="bg-[#1A140F]">
                  <td className="py-3 px-4 font-bold text-[#F59E0B]">change_file_heuristic</td>
                  <td className="py-3 px-4">8.9% (4/41)</td>
                  <td className="py-3 px-4 text-[#8B919D]">3.7s</td>
                  <td className="py-3 px-4 text-[#F59E0B] font-bold">66.7%</td>
                  <td className="py-3 px-4 text-[#F59E0B]">auth_token_verification_bug (MISSED)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">graph_only</td>
                  <td className="py-3 px-4">11.4% (5/41)</td>
                  <td className="py-3 px-4 text-[#8B919D]">5.6s</td>
                  <td className="py-3 px-4 text-[#10B981] font-bold">100.0%</td>
                  <td className="py-3 px-4 text-[#10B981]">None (100% caught)</td>
                </tr>
                <tr className="bg-[#101524]">
                  <td className="py-3 px-4 font-bold text-[#60A5FA]">graph_plus_ml [Recommended]</td>
                  <td className="py-3 px-4 font-bold text-white">11.4% (5/41)</td>
                  <td className="py-3 px-4 text-[#60A5FA] font-bold">5.6s (7.3x faster)</td>
                  <td className="py-3 px-4 text-[#10B981] font-bold">100.0%</td>
                  <td className="py-3 px-4 text-[#10B981]">None (100% caught)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1E222A] bg-[#07080A] py-8 text-xs font-mono text-[#636975]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[#EDEDEE] font-bold">RippleCI</span>
            <span>·</span>
            <span>Apache-2.0 License</span>
            <span>·</span>
            <a href="https://github.com/Shikhyy/RippleCI.git" target="_blank" rel="noreferrer" className="text-[#8B919D] hover:text-[#EDEDEE]">
              GitHub
            </a>
          </div>

          <div className="flex items-center gap-4 text-[#636975]">
            <span>FalkorDB Hackathon 2026</span>
            <span>·</span>
            <span>v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

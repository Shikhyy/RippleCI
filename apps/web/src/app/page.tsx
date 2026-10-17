import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Database,
  FileCode2,
  GitBranch,
  GitPullRequest,
  Network,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";

import { GraphCanvas } from "@/components/GraphCanvas";
import { Navbar } from "@/components/Navbar";
import { TerminalBlock } from "@/components/TerminalBlock";
import { DEMO_GRAPH_DATA } from "@/lib/api";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-[#F3F4F6]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 border-b border-slate-900 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B15_1px,transparent_1px),linear-gradient(to_bottom,#1E293B15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-300 text-xs font-mono mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Graph-Native Release Intelligence Toolkit
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto font-sans leading-[1.1]">
            Understand change blast radius.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
              Select the tests that matter.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            RippleCI parses your codebase into FalkorDB, traces multi-hop downstream impact from modified symbols, ranks regression tests under a runtime budget, and verifies plans with bounded mutation testing.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors shadow-lg shadow-blue-600/20"
            >
              <span>Explore Web Companion</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/app/graph"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              <Network className="w-4 h-4 text-blue-400" />
              <span>Interactive Graph Preview</span>
            </Link>
          </div>

          {/* Quick Install Banner */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <span>Install CLI:</span>
            <code className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              pip install rippleci
            </code>
          </div>
        </div>
      </section>

      {/* Interactive CLI Demo Section */}
      <section className="py-16 border-b border-slate-900 bg-[#0B0F1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs uppercase font-mono tracking-wider text-blue-400 font-semibold">
              CLI-First Developer Experience
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Instant feedback in your local terminal
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Run impact analysis, plan tests under execution budgets, and verify changes with proof-carrying outputs.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <TerminalBlock />
          </div>
        </div>
      </section>

      {/* Interactive Graph Preview Section */}
      <section id="features" className="py-20 border-b border-slate-900 bg-[#090D16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">
                FalkorDB Graph Engine
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Multi-Hop Dependency Blast Radius
              </h2>
              <p className="mt-1 text-sm text-slate-400 max-w-xl">
                Explore the actual dependency graph below. Click any node to inspect its symbol signature, call hierarchy, and evidence paths.
              </p>
            </div>

            <Link
              href="/app/graph"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              <span>Full Screen Graph Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <GraphCanvas initialData={DEMO_GRAPH_DATA} />
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 border-b border-slate-900 bg-[#0B0F1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-wider text-blue-400 font-semibold">
              The Workflow
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              From Git Change to Evidence-Backed Release
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileCode2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">1. Repository Indexing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parses Python AST, resolves cross-module imports, extracts symbol ranges, and collects pytest node IDs into FalkorDB with stable hashes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">2. Graph Traversal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parameterized Cypher queries traverse incoming <code className="text-blue-300">CALLS</code> paths to uncover indirect, multi-hop callers affected by changes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">3. ML Prioritization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Heuristic and LightGBM/GBDT rankers score candidate tests by graph proximity, coverage overlap, churn, and historical failure rate within budget.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">4. Bounded Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Executes the selected tests and injects controlled AST mutations to verify that surviving mutants trigger fallback if blind spots exist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Research & Methodology Section */}
      <section id="benchmarks" className="py-20 border-b border-slate-900 bg-[#090D16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs uppercase font-mono tracking-wider text-blue-400 font-semibold">
              Research-Grounded Engineering
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Evaluation & Strategy Comparisons
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              RippleCI builds upon research from Google's regression-test selection at scale and mutation-aware test selection. We rigorously measure four distinct strategies on identical evaluation fixtures:
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-sans">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Strategy</th>
                    <th className="py-3.5 px-4 font-semibold">Selection Ratio</th>
                    <th className="py-3.5 px-4 font-semibold">Avg. Duration</th>
                    <th className="py-3.5 px-4 font-semibold">Fault Recall</th>
                    <th className="py-3.5 px-4 font-semibold">Downstream Regressions Caught</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300 font-mono">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-white">1. Full Suite</td>
                    <td className="py-3.5 px-4">100.0%</td>
                    <td className="py-3.5 px-4">13.0s</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-3.5 px-4">All (expensive baseline)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-yellow-400">2. Change-File Heuristic</td>
                    <td className="py-3.5 px-4">30.8%</td>
                    <td className="py-3.5 px-4">4.0s</td>
                    <td className="py-3.5 px-4 text-red-400 font-bold">33.3%</td>
                    <td className="py-3.5 px-4 text-red-300">Misses cross-file callers (e.g. orders)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-blue-400">3. Graph-Only (FalkorDB)</td>
                    <td className="py-3.5 px-4">46.2%</td>
                    <td className="py-3.5 px-4">6.0s</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-3.5 px-4 text-emerald-300">Catches 100% of multi-hop regressions</td>
                  </tr>
                  <tr className="bg-blue-950/20">
                    <td className="py-3.5 px-4 font-semibold text-cyan-300">4. Graph + ML Ranking</td>
                    <td className="py-3.5 px-4 font-bold text-white">38.5%</td>
                    <td className="py-3.5 px-4">4.8s</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-3.5 px-4 text-emerald-300">Optimal budget-recall frontier</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Reference: Google RTS at Scale (2020)
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Reference: Mutation-Aware RTS (PMC12808596)
            </span>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="py-16 bg-[#060910] border-t border-slate-900 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to bring release intelligence to your pipeline?
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
            Open-source, self-hosted, and powered by FalkorDB. Start indexing your repositories today.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/app"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Open Web Companion
            </Link>
            <a
              href="https://github.com/Shikhyy/RippleCI.git"
              target="_blank"
              rel="noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              GitHub Repository
            </a>
          </div>
          <div className="mt-12 text-xs text-slate-600">
            RippleCI is open source under the Apache-2.0 License. FalkorDB is a registered trademark of FalkorDB Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}

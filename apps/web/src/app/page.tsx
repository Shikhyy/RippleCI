"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  Cpu,
  Database,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Layers,
  Network,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { GraphCanvas } from "@/components/GraphCanvas";
import { Navbar } from "@/components/Navbar";
import { SpectralDrape } from "@/components/SpectralDrape";
import { TerminalBlock } from "@/components/TerminalBlock";
import { DEMO_GRAPH_DATA } from "@/lib/api";

export default function LandingPage() {
  const [copiedPip, setCopiedPip] = useState(false);

  const handleCopyPip = () => {
    navigator.clipboard.writeText("pip install rippleci");
    setCopiedPip(true);
    setTimeout(() => setCopiedPip(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      <Navbar />

      {/* Hero Section with Spectral Drape in Background */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 border-b border-[#6A4BFF]/20 overflow-hidden">
        {/* Spectral Drape: 3D folding glowing drape of dots */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60 z-0"
          style={{
            maskImage: "radial-gradient(ellipse 90% 75% at 50% 35%, black 45%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 75% at 50% 35%, black 45%, transparent 100%)",
          }}
        >
          <SpectralDrape
            colors={["#6A4BFF", "#E4DBFF"]}
            backgroundColor="transparent"
            density={1.15}
            dotSize={1.15}
            strands={8}
            amplitude={1.05}
            frequency={1.0}
            thickness={0.72}
            depth={1.1}
            softness={0.65}
            intensity={0.95}
            colorShift={0.35}
            tilt={-40}
            turn={-45}
            roll={110}
            flow={1.05}
            speed={1.0}
            interactive={true}
          />
        </div>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#6A4BFF]/20 via-[#6A4BFF]/5 to-transparent pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl">
            {/* Header Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#6A4BFF]/30 bg-[#0f0e17]/80 backdrop-blur-md text-[#E4DBFF] text-xs font-medium mb-6 shadow-glow">
              <span className="w-2 h-2 rounded-full bg-[#6A4BFF] animate-pulse" />
              <span>FalkorDB Graph-Native Release Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Never merge untested blast radius again.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl font-normal">
              RippleCI indexes repository AST call graphs into FalkorDB, traces multi-hop downstream consequences of pull requests, prioritizes regression tests with learned ranking under tight budgets, and counterfactually verifies releases with bounded mutation testing.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs">
              <Link
                href="/app"
                className="flex items-center gap-2 bg-[#6A4BFF] hover:bg-[#5835ea] text-white font-semibold px-5 py-2.5 rounded-lg shadow-[0_1px_16px_rgba(106,75,255,0.45),inset_0_1px_0_rgba(228,219,255,0.3)] transition-all active:scale-[0.98]"
              >
                <span>Launch Web Workbench</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/app/graph"
                className="flex items-center gap-2 bg-[#0f0e17]/90 hover:bg-[#151322] text-[#E4DBFF] border border-[#6A4BFF]/30 hover:border-[#6A4BFF]/60 font-medium px-4 py-2.5 rounded-lg transition-all active:scale-[0.98]"
              >
                <Network className="w-3.5 h-3.5 text-[#6A4BFF]" />
                <span>Explore FalkorDB Graph</span>
              </Link>

              <button
                onClick={handleCopyPip}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#6A4BFF]/25 hover:border-[#6A4BFF]/50 bg-[#0f0e17]/80 hover:bg-[#151322] text-[#E4DBFF] font-mono transition-all text-xs active:scale-[0.98]"
              >
                <span>pip install rippleci</span>
                {copiedPip ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#E4DBFF]/70" />
                )}
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="mt-12 pt-8 border-t border-[#6A4BFF]/20 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <div className="text-2xl font-bold tracking-tight text-white">7.3x</div>
                <div className="text-xs text-zinc-400 mt-0.5">Faster CI execution</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-emerald-400">100.0%</div>
                <div className="text-xs text-zinc-400 mt-0.5">Benchmark fault recall</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#E4DBFF]">&lt; 2ms</div>
                <div className="text-xs text-zinc-400 mt-0.5">FalkorDB Cypher latency</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-amber-400">0</div>
                <div className="text-xs text-zinc-400 mt-0.5">Verification blind spots</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Developer Workflow Section */}
      <section className="py-16 md:py-20 border-b border-[#6A4BFF]/20 bg-[#0c0b12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#6A4BFF] font-semibold">
                CLI Developer Workflow
              </div>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Autonomous terminal execution
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Deterministic outputs · Machine-readable JSON · Reusable GitHub Action
            </p>
          </div>

          <TerminalBlock />
        </div>
      </section>

      {/* FalkorDB Graph Canvas Section */}
      <section className="py-16 md:py-20 border-b border-[#6A4BFF]/20 bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#6A4BFF] font-semibold">
                FalkorDB Subgraph
              </div>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Downstream blast radius visualization
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Click any symbol or test to inspect caller coordinates, graph hops, and Cypher traversal paths.
              </p>
            </div>
            <Link
              href="/app/graph"
              className="text-xs font-medium text-[#E4DBFF] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#6A4BFF]/30 bg-[#6A4BFF]/15 transition-colors"
            >
              <span>Full Screen Graph Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <GraphCanvas initialData={DEMO_GRAPH_DATA} />
        </div>
      </section>

      {/* 4-Step Technical Architecture */}
      <section className="py-16 md:py-20 border-b border-[#6A4BFF]/20 bg-[#0c0b12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-mono uppercase tracking-wider text-[#6A4BFF] font-semibold">
              Pipeline Architecture
            </div>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold text-white tracking-tight">
              From code modification to evidence-backed release
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Four complementary stages combining static AST indexing, graph database traversals, learned ranking, and mutation testing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="craft-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#6A4BFF]/15 border border-[#6A4BFF]/30 flex items-center justify-center text-[#E4DBFF] font-mono text-xs font-bold">
                  01
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">AST & Symbol Parsing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Parses Python ASTs, resolves internal import targets, and registers function and test case nodes with deterministic hashes into FalkorDB.
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#E4DBFF]/60">
                ripple index
              </div>
            </div>

            <div className="craft-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#6A4BFF]/15 border border-[#6A4BFF]/30 flex items-center justify-center text-[#E4DBFF] font-mono text-xs font-bold">
                  02
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">FalkorDB Graph Traversal</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Executes parameterized Cypher queries across incoming CALLS edges to discover indirect, multi-hop callers impacted by the change.
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#E4DBFF]/60">
                ripple impact
              </div>
            </div>

            <div className="craft-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#6A4BFF]/15 border border-[#6A4BFF]/30 flex items-center justify-center text-[#E4DBFF] font-mono text-xs font-bold">
                  03
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Learned Prioritization</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gradient boosted decision trees rank candidate tests by graph proximity, churn, coverage overlap, and failure probability under budget.
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#E4DBFF]/60">
                ripple plan --budget 300
              </div>
            </div>

            <div className="craft-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#6A4BFF]/15 border border-[#6A4BFF]/30 flex items-center justify-center text-[#E4DBFF] font-mono text-xs font-bold">
                  04
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Counterfactual Verification</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Injects transient AST mutations into modified lines to verify the selected test plan catches injected faults before release approval.
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#E4DBFF]/60">
                ripple verify --mutations 5
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benchmark Matrix */}
      <section className="py-16 md:py-20 border-b border-[#6A4BFF]/20 bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-8">
            <div className="text-xs font-mono uppercase tracking-wider text-[#6A4BFF] font-semibold">
              Evaluation & Benchmarks
            </div>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Comparing 4 regression selection strategies
            </h2>
            <p className="mt-2 text-xs text-zinc-400">
              Evaluated across fault injection scenarios on real multi-hop services.
            </p>
          </div>

          <div className="craft-card overflow-hidden text-xs font-mono">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0f0e17]/90 border-b border-[#6A4BFF]/20 text-zinc-400">
                  <tr>
                    <th className="py-3 px-5 font-semibold">Strategy</th>
                    <th className="py-3 px-5 font-semibold">Selection Ratio</th>
                    <th className="py-3 px-5 font-semibold">Avg. Duration</th>
                    <th className="py-3 px-5 font-semibold">Fault Recall</th>
                    <th className="py-3 px-5 font-semibold">Missed Scenarios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  <tr className="hover:bg-[#151322] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-white">full_suite</td>
                    <td className="py-3.5 px-5">100.0% (41/41)</td>
                    <td className="py-3.5 px-5 text-zinc-400">41.0s</td>
                    <td className="py-3.5 px-5 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-3.5 px-5 text-emerald-400">None (baseline)</td>
                  </tr>
                  <tr className="bg-amber-500/[0.04] hover:bg-amber-500/[0.08] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-amber-400">change_file_heuristic</td>
                    <td className="py-3.5 px-5">8.9% (4/41)</td>
                    <td className="py-3.5 px-5 text-zinc-400">3.7s</td>
                    <td className="py-3.5 px-5 text-amber-400 font-bold">66.7%</td>
                    <td className="py-3.5 px-5 text-amber-400">auth_token_verification_bug (MISSED)</td>
                  </tr>
                  <tr className="hover:bg-[#151322] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-white">graph_only</td>
                    <td className="py-3.5 px-5">11.4% (5/41)</td>
                    <td className="py-3.5 px-5 text-zinc-400">5.6s</td>
                    <td className="py-3.5 px-5 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-3.5 px-5 text-emerald-400">None (100% caught)</td>
                  </tr>
                  <tr className="bg-[#6A4BFF]/[0.08] hover:bg-[#6A4BFF]/[0.14] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#E4DBFF]">graph_plus_ml [Recommended]</td>
                    <td className="py-3.5 px-5 font-bold text-white">11.4% (5/41)</td>
                    <td className="py-3.5 px-5 text-[#E4DBFF] font-bold">5.6s (7.3x faster)</td>
                    <td className="py-3.5 px-5 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-3.5 px-5 text-emerald-400 font-bold">None (100% caught)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#6A4BFF]/20 bg-zinc-950 py-10 text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">RippleCI</span>
            <span>·</span>
            <span>Apache-2.0 License</span>
            <span>·</span>
            <a
              href="https://github.com/Shikhyy/RippleCI.git"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>

          <div className="flex items-center gap-4 text-zinc-500">
            <span>FalkorDB Hackathon 2026</span>
            <span>·</span>
            <span>v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

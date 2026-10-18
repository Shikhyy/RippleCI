"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Github,
  Layers,
  Network,
  Play,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

import { ConnectRepoModal } from "@/components/ConnectRepoModal";
import { Navbar } from "@/components/Navbar";
import { TerminalBlock } from "@/components/TerminalBlock";
import { BlastRadiusCalculator } from "@/components/BlastRadiusCalculator";
import { CanvasRevealEffectDemo3 } from "@/components/CanvasRevealEffectDemo3";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

const SDK_SNIPPETS = [
  {
    id: "quickstart",
    label: "Python SDK Quickstart",
    filename: "ci_pipeline.py",
    code: `from rippleci import RippleProject

# 1. Open repository with FalkorDB graph discovery
project = RippleProject.open(".")

# 2. Trace multi-hop blast radius of current pull request
impact = project.analyzer.analyze(base="origin/main", head="HEAD")

# 3. Select ML-prioritized tests under a 180s runtime budget
plan = project.planner.plan(impact=impact, budget_seconds=180.0)

print(f"Selected {len(plan.selected_tests)} tests ({plan.estimated_total_seconds:.1f}s)")
for test in plan.selected_tests:
    print(f"  [{test.rank}] {test.name} (ML score: {test.rank_score:.2f})")`,
  },
  {
    id: "verification",
    label: "Mutation Verification",
    filename: "verify_release.py",
    code: `from rippleci import RippleProject

project = RippleProject.open(".")
impact = project.analyzer.analyze(base="origin/main", head="HEAD")
plan = project.planner.plan(impact=impact, budget_seconds=120.0)

# Inject bounded AST mutations to prove selected tests catch real faults
verification = project.verifier.verify(
    plan=plan,
    target_files=impact.changed_files,
    max_mutations=4
)

print(f"Mutants tested: {verification.mutations_tested_count}")
print(f"Mutants killed: {verification.killed_mutations_count}")
print(f"Mutation score: {verification.mutation_score:.1%}")

if verification.mutation_score < 0.8:
    raise SystemExit("Release verification failed: test plan blind spots detected!")`,
  },
  {
    id: "cypher",
    label: "FalkorDB Cypher Query",
    filename: "graph_query.cql",
    code: `// Multi-hop AST caller traversal in FalkorDB
MATCH (target:Symbol {qualified_name: $target_symbol})
MATCH path = (caller:Symbol)-[:CALLS*1..3]->(target)
WITH caller, length(path) AS hops, [n IN nodes(path) | n.name] AS path_names
MATCH (test:TestCase)-[:COVERS]->(caller)
RETURN caller.name, hops, path_names, test.name
ORDER BY hops ASC, test.name ASC
LIMIT 50;`,
  },
];

export default function LandingPage() {
  const [copiedPip, setCopiedPip] = useState<boolean>(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<string>("quickstart");
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  const activeSnippet = SDK_SNIPPETS.find((s) => s.id === activeSnippetTab) || SDK_SNIPPETS[0];

  const handleCopyPip = () => {
    navigator.clipboard.writeText("pip install rippleci");
    setCopiedPip(true);
    setTimeout(() => setCopiedPip(false), 2000);
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(activeSnippet.code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c0e] text-zinc-100 font-sans relative selection:bg-[#6CC6CB]/30 selection:text-[#EAE5C9]">
      <Navbar />

      {/* Connect Repository Modal */}
      <ConnectRepoModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      {/* Hero Section */}
      <section className="relative pt-36 pb-28 border-b border-[#6CC6CB]/20 overflow-hidden">
        {/* Dynamic Aceternity Canvas Reveal Shaders Background */}
        <div className="absolute inset-0 z-0 opacity-45 pointer-events-none">
          <CanvasRevealEffect
            animationSpeed={1.2}
            containerClassName="bg-transparent"
            colors={[
              [108, 198, 203],
              [34, 211, 238],
              [234, 229, 201],
            ]}
            opacities={[0.1, 0.15, 0.2, 0.25, 0.35, 0.5, 0.7]}
            dotSize={2.2}
            showGradient={true}
          />
        </div>

        {/* Ambient Radial Fog & Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080c0e]/30 via-transparent to-[#080c0e] pointer-events-none z-[1]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] bg-[#6CC6CB]/[0.10] blur-[160px] rounded-full pointer-events-none z-[1]" />

        {/* Floating Architectural Telemetry Chips on Desktop */}
        <div className="hidden xl:flex items-center justify-between absolute inset-x-12 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="p-4 rounded-2xl bg-[#0a1014]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_35px_rgba(108,198,203,0.18)] flex items-center gap-3.5 transition-all hover:scale-105 pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 flex items-center justify-center border border-cyan-500/40 text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">FalkorDB Cypher</div>
              <div className="text-xs font-mono text-white font-bold">&lt; 14.2ms AST Multi-Hop</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a1014]/90 border border-amber-500/30 backdrop-blur-xl shadow-[0_0_35px_rgba(234,229,201,0.18)] flex items-center gap-3.5 transition-all hover:scale-105 pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-amber-950 flex items-center justify-center border border-amber-500/40 text-[#EAE5C9]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#EAE5C9] uppercase tracking-wider font-semibold">Learned Prioritization</div>
              <div className="text-xs font-mono text-white font-bold">100% Fault Recall Guarantee</div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#6CC6CB]/40 bg-[#0d1417]/95 backdrop-blur-xl text-[#EAE5C9] text-xs font-mono mb-8 shadow-[0_0_25px_rgba(108,198,203,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#6CC6CB] animate-ping" />
            <span className="font-semibold">FalkorDB Graph-Native Release Intelligence</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-bold">v0.1.0 Ready</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto mb-6">
            Run the right tests,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAE5C9] via-[#6CC6CB] to-[#EAE5C9]">
              close to every PR.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Index code AST into FalkorDB, trace multi-hop blast radius, prioritize regression tests with ML under runtime budgets, and verify with counterfactual mutation testing before merge.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-mono mb-12">
            <Link
              href="/app"
              className="flex items-center gap-2 bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-[0_1px_25px_rgba(108,198,203,0.45)] hover:shadow-[0_1px_35px_rgba(108,198,203,0.65)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Web Companion</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-2 bg-[#0d1417]/90 hover:bg-[#121b1f] text-white border border-[#6CC6CB]/40 px-5 py-3.5 rounded-xl transition-all font-semibold hover:border-cyan-400 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Github className="w-4 h-4 text-[#6CC6CB]" />
              <span>Connect Repository</span>
            </button>

            <button
              onClick={handleCopyPip}
              className="flex items-center gap-2 bg-black/70 hover:bg-white/[0.08] text-[#EAE5C9] border border-white/[0.15] px-4 py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>pip install rippleci</span>
              {copiedPip ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#6CC6CB]" />}
            </button>
          </div>

          {/* Trust Value Points */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>80%+ CI Runtime Saved</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>99.4% Empirical Fault Recall</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Credentials Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Blast Radius Engine Demo */}
      <section className="py-20 border-b border-[#6CC6CB]/20 bg-[#060a0c]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#6CC6CB]/30 bg-[#0d1417] text-[#6CC6CB] text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Interactive Simulator</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Test-Drive the Prioritization Engine
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm">
              Adjust runtime budgets and pick code targets to see how FalkorDB graph traversal and ML rankers prioritize regression suites in real time.
            </p>
          </div>

          <BlastRadiusCalculator />
        </div>
      </section>

      {/* Aceternity Canvas Reveal Effect Architecture Showcase */}
      <section className="border-b border-[#6CC6CB]/20 bg-[#060a0c]/80 relative overflow-hidden">
        <CanvasRevealEffectDemo3 />
      </section>

      {/* Interactive CLI Terminal Section */}
      <section className="py-20 border-b border-[#6CC6CB]/20 bg-[#060a0c]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Developer-First CLI
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm">
              Run standalone in any terminal, integrate into GitHub Actions, or embed into custom workflows
            </p>
          </div>

          <TerminalBlock />
        </div>
      </section>

      {/* Programmatic Python SDK Code Snippets */}
      <section className="py-20 border-b border-[#6CC6CB]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Type-Safe Python SDK
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm">
              Clean, typed Python abstractions for programmatic integration into custom release infrastructure
            </p>
          </div>

          <div className="rounded-2xl border border-[#6CC6CB]/20 bg-[#060a0c] overflow-hidden shadow-2xl">
            {/* Header tabs */}
            <div className="px-4 py-3 bg-[#0d1417] border-b border-[#6CC6CB]/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {SDK_SNIPPETS.map((snippet) => (
                  <button
                    key={snippet.id}
                    onClick={() => setActiveSnippetTab(snippet.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      activeSnippetTab === snippet.id
                        ? "bg-[#6CC6CB]/20 text-[#EAE5C9] font-bold border border-[#6CC6CB]/40 shadow-[0_0_10px_rgba(108,198,203,0.15)]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {snippet.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                  {activeSnippet.filename}
                </span>
                <button
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-black/40 hover:bg-white/[0.06] border border-white/[0.08] transition-all"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? "Copied" : "Copy Code"}</span>
                </button>
              </div>
            </div>

            {/* Code display */}
            <div className="p-5 font-mono text-xs text-[#EAE5C9]/95 overflow-x-auto leading-relaxed bg-[#080c0e]">
              <pre className="whitespace-pre">{activeSnippet.code}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Stop waiting on slow CI suites.<br />
            <span className="text-[#6CC6CB]">Verify PRs with connected evidence.</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-10 text-sm">
            Connect any GitHub repository with zero configuration or install the typed Python package to get started in under a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs sm:text-sm">
            <Link
              href="/app"
              className="bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-extrabold px-7 py-3.5 rounded-xl transition-all shadow-[0_1px_25px_rgba(108,198,203,0.45)] active:scale-[0.98]"
            >
              Open Web Companion
            </Link>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="bg-[#0d1417] hover:bg-[#121b1f] text-white border border-[#6CC6CB]/30 px-6 py-3.5 rounded-xl transition-all font-semibold"
            >
              Connect Repository
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#6CC6CB]/20 py-8 bg-[#060a0c] text-xs font-mono text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Ripple<span className="text-[#6CC6CB]">CI</span></span>
            <span>•</span>
            <span>Graph-Native Release Intelligence Toolkit</span>
          </div>
          <div>
            Apache-2.0 License · Powered by FalkorDB
          </div>
        </div>
      </footer>
    </div>
  );
}

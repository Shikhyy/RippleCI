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
import { ContourTide } from "@/components/ui/contour-tide";

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
    <div className="min-h-screen flex flex-col bg-black text-neutral-300 font-sans relative selection:bg-white/25 selection:text-white overflow-hidden">
      {/* React Bits Pro - Contour Tide (Ocean of particles rolling in waves across entire landing page) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-95">
        <ContourTide
          colors={["#181a1f", "#f4f4f5"]}
          backgroundColor="transparent"
          density={1.15}
          particleSize={1.4}
          waveHeight={1.4}
          choppiness={0.9}
          wavelength={1.2}
          windAngle={18}
          horizon={0.22}
          fog={1.0}
          glow={0.75}
          foam={1.5}
          speed={0.7}
          interactive={true}
          parallax={1.3}
          swell={1.4}
          swellRadius={1.2}
          clickRipples={true}
          className="w-full h-full"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Connect Repository Modal */}
        <ConnectRepoModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
        />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 border-b border-white/10 overflow-hidden bg-transparent">
          {/* Subtle Architectural Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

          {/* Soft Ambient Spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-white/15 via-white/5 to-transparent blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/20 bg-black/50 text-neutral-200 text-xs font-mono mb-8 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_#ffffff]" />
              <span>FalkorDB Graph-Native Release Intelligence</span>
              <span className="text-white/30">|</span>
              <span className="text-neutral-400">Open Source</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto mb-6">
              Understand what could break,<br className="hidden sm:inline" />{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
                before you ship.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Trace multi-hop blast radius across code changes, prioritize the 10% of tests that catch 100% of regressions under budget, and verify releases with counterfactual mutation testing.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-mono mb-14">
              <Link
                href="/app"
                className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-black font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.35)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Launch Web Companion</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="flex items-center gap-2 bg-black/60 hover:bg-white/[0.08] text-white border border-white/20 px-5 py-3.5 rounded-xl transition-all font-semibold hover:border-white/50 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
              >
                <Github className="w-4 h-4 text-white" />
                <span>Connect Repository</span>
              </button>

              <button
                onClick={handleCopyPip}
                className="flex items-center gap-2 bg-black/60 hover:bg-white/[0.08] text-neutral-300 border border-white/20 px-4 py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-xl"
              >
                <span>pip install rippleci</span>
                {copiedPip ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              </button>
            </div>

            {/* Hero Interactive Proof Visual: Grounded Live AST Traversal */}
            <div className="max-w-4xl mx-auto text-left rounded-2xl border border-white/15 bg-black/55 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden mb-12">
              {/* Window Titlebar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/70 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-white/20 border border-white/40" />
                  <span className="w-3 h-3 rounded-full bg-white/40 border border-white/60" />
                  <span className="w-3 h-3 rounded-full bg-white/70 border border-white" />
                  <span className="ml-2 font-mono text-xs text-neutral-400">git diff --cached (auth/tokens.py)</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-neutral-300 bg-white/[0.08] px-2.5 py-0.5 rounded border border-white/15">
                  <span>FalkorDB Cypher</span>
                  <span className="text-white/30">•</span>
                  <span>14.2ms</span>
                </div>
              </div>

              {/* Split Content: Diff -> Provenance -> Verdict */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 font-mono text-xs">
                {/* Column 1: Diff Snippet */}
                <div className="p-4 space-y-2 bg-black/40">
                  <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-2">
                    01 // Modified AST Symbol
                  </div>
                  <div className="bg-black/70 rounded-lg p-3 space-y-1 font-mono text-[11px] border border-white/10 overflow-x-auto">
                    <div className="text-neutral-500">@@ -40,3 +40,3 @@</div>
                    <div className="text-neutral-400 bg-white/[0.06] px-1 rounded">- def verify_token(token):</div>
                    <div className="text-white bg-white/15 px-1 rounded font-medium">+ def verify_token(token, max_age=3600):</div>
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-1">
                    <span>Symbol: <code className="text-white font-mono">verify_token</code></span>
                    <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded border border-white/20">1 Modified</span>
                  </div>
                </div>

                {/* Column 2: Graph Provenance Chain */}
                <div className="p-4 space-y-2 bg-black/30">
                  <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-2">
                    02 // Cypher Multi-Hop Trace
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-black/60 border border-white/10 flex items-center justify-between">
                      <span className="text-neutral-200">verify_token</span>
                      <span className="text-neutral-500 text-[10px]">HOP 0</span>
                    </div>
                    <div className="flex justify-center text-neutral-500 text-[10px]">▼ [:CALLS]</div>
                    <div className="p-2 rounded bg-black/60 border border-white/10 flex items-center justify-between">
                      <span className="text-neutral-200">dispatch_auth</span>
                      <span className="text-neutral-500 text-[10px]">HOP 1</span>
                    </div>
                    <div className="flex justify-center text-white/70 text-[10px]">▼ [:COVERS]</div>
                    <div className="p-2 rounded bg-white/10 border border-white/30 text-white flex items-center justify-between font-bold shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                      <span>test_expired_token</span>
                      <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-bold">SELECTED</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Bounded Verification Decision */}
                <div className="p-4 space-y-3 bg-black/40 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-2">
                      03 // Verification Verdict
                    </div>
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Suite Reduction:</span>
                        <span className="text-white font-bold">96.0% saved</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Selected Tests:</span>
                        <span className="text-white font-bold">2 / 54</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Mutants Killed:</span>
                        <span className="text-white font-bold">4 / 4 (100%)</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Fault Recall:</span>
                        <span className="text-white font-bold">100.0%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/30 text-white text-center font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.12)]">
                    VERDICT: RELEASE_SAFE
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Value Points */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>80%+ CI Runtime Saved</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>99.4% Empirical Fault Recall</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Zero Credentials Required</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Blast Radius Engine Demo */}
        <section className="py-20 border-b border-white/10 bg-black/45 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/[0.05] text-neutral-200 text-xs font-mono mb-3 backdrop-blur-xl">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Live Interactive Simulator</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
                Test-Drive the Prioritization Engine
              </h2>
              <p className="text-neutral-400 max-w-xl mx-auto text-sm">
                Adjust runtime budgets and pick code targets to see how FalkorDB graph traversal and ML rankers prioritize regression suites in real time.
              </p>
            </div>

            <BlastRadiusCalculator />
          </div>
        </section>

        {/* Aceternity Canvas Reveal Effect Architecture Showcase */}
        <section className="border-b border-white/10 bg-black/45 backdrop-blur-md relative overflow-hidden">
          <CanvasRevealEffectDemo3 />
        </section>

        {/* Interactive CLI Terminal Section */}
        <section className="py-20 border-b border-white/10 bg-black/45 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
                Developer-First CLI
              </h2>
              <p className="text-neutral-400 max-w-xl mx-auto text-sm">
                Run standalone in any terminal, integrate into GitHub Actions, or embed into custom workflows
              </p>
            </div>

            <TerminalBlock />
          </div>
        </section>

        {/* Programmatic Python SDK Code Snippets */}
        <section id="sdk" className="py-20 border-b border-white/10 bg-black/45 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
                Type-Safe Python SDK
              </h2>
              <p className="text-neutral-400 max-w-xl mx-auto text-sm">
                Clean, typed Python abstractions for programmatic integration into custom release infrastructure
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/55 backdrop-blur-2xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.85)]">
              {/* Header tabs */}
              <div className="px-4 py-3 bg-black/70 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {SDK_SNIPPETS.map((snippet) => (
                    <button
                      key={snippet.id}
                      onClick={() => setActiveSnippetTab(snippet.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        activeSnippetTab === snippet.id
                          ? "bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                          : "text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      {snippet.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
                    {activeSnippet.filename}
                  </span>
                  <button
                    onClick={handleCopySnippet}
                    className="flex items-center gap-1.5 text-xs font-mono text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/15 border border-white/15 transition-all"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                    <span>{copiedSnippet ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
              </div>

              {/* Code display */}
              <div className="p-5 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed bg-black/60">
                <pre className="whitespace-pre">{activeSnippet.code}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 relative overflow-hidden bg-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
              Stop waiting on slow CI suites.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
                Verify PRs with connected evidence.
              </span>
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto mb-10 text-sm">
              Connect any GitHub repository with zero configuration or install the typed Python package to get started in under a minute.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs sm:text-sm">
              <Link
                href="/app"
                className="bg-white hover:bg-neutral-200 text-black font-extrabold px-7 py-3.5 rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.35)] active:scale-[0.98]"
              >
                Open Web Companion
              </Link>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="bg-black/60 hover:bg-white/10 text-white border border-white/20 px-6 py-3.5 rounded-xl transition-all font-semibold backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
              >
                Connect Repository
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 bg-black/65 backdrop-blur-2xl text-xs font-mono text-neutral-400">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Ripple<span className="text-neutral-400">CI</span></span>
              <span>•</span>
              <span>Graph-Native Release Intelligence Toolkit</span>
            </div>
            <div>
              Apache-2.0 License · Powered by FalkorDB
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen flex flex-col bg-[#0B0D10] text-[#C9C4B8] font-sans relative selection:bg-[#E5A952]/40 selection:text-white overflow-hidden">
      {/* React Bits Pro - Contour Tide (Ocean of particles rolling in waves across entire landing page) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
        <ContourTide
          colors={["#1B3B3F", "#E5A952"]}
          backgroundColor="transparent"
          density={0.85}
          particleSize={1.15}
          waveHeight={1.25}
          choppiness={0.85}
          wavelength={1.15}
          windAngle={14}
          horizon={0.22}
          fog={1.15}
          glow={0.5}
          foam={1.2}
          speed={0.65}
          interactive={true}
          parallax={1.2}
          swell={1.3}
          swellRadius={1.1}
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
        <section className="relative pt-32 pb-20 border-b border-[#1B3B3F]/70 overflow-hidden">
          {/* Subtle Architectural Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1B3B3F_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-25" />

          {/* Soft Ambient Spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#E5A952]/15 via-[#1B3B3F]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full border border-[#E5A952]/40 bg-[#121A2B] text-[#C9C4B8] text-xs font-mono mb-8 backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5A952] animate-pulse" />
            <span>FalkorDB Graph-Native Release Intelligence</span>
            <span className="text-[#C9C4B8]/40">|</span>
            <span className="text-[#C9C4B8]/70">Open Source</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto mb-6">
            Understand what could break,<br className="hidden sm:inline" />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#C9C4B8] to-[#E5A952]">
              before you ship.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#C9C4B8]/80 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Trace multi-hop blast radius across code changes, prioritize the 10% of tests that catch 100% of regressions under budget, and verify releases with counterfactual mutation testing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-mono mb-14">
            <Link
              href="/app"
              className="flex items-center gap-2 bg-[#E5A952] hover:bg-[#F5BD66] text-[#0B0D10] font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-[0_1px_25px_rgba(229,169,82,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Web Companion</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-2 bg-[#121A2B] hover:bg-[#1B3B3F] text-white border border-[#1B3B3F] px-5 py-3.5 rounded-xl transition-all font-semibold hover:border-[#E5A952] hover:scale-[1.02] active:scale-[0.98]"
            >
              <Github className="w-4 h-4 text-[#E5A952]" />
              <span>Connect Repository</span>
            </button>

            <button
              onClick={handleCopyPip}
              className="flex items-center gap-2 bg-[#0B0D10]/80 hover:bg-white/[0.06] text-[#C9C4B8] border border-[#1B3B3F] px-4 py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>pip install rippleci</span>
              {copiedPip ? <Check className="w-4 h-4 text-[#2E4A32]" /> : <Copy className="w-4 h-4 text-[#E5A952]" />}
            </button>
          </div>

          {/* Hero Interactive Proof Visual: Grounded Live AST Traversal */}
          <div className="max-w-4xl mx-auto text-left rounded-2xl border border-[#1B3B3F] bg-[#121A2B]/85 backdrop-blur-xl shadow-card overflow-hidden mb-12">
            {/* Window Titlebar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1B3B3F] bg-[#0B0D10]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#8B5E3C]" />
                <span className="w-3 h-3 rounded-full bg-[#E5A952]" />
                <span className="w-3 h-3 rounded-full bg-[#2E4A32]" />
                <span className="ml-2 font-mono text-xs text-[#C9C4B8]/60">git diff --cached (auth/tokens.py)</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#C9C4B8] bg-[#1B3B3F]/60 px-2.5 py-0.5 rounded border border-[#1B3B3F]">
                <span>FalkorDB Cypher</span>
                <span className="text-[#C9C4B8]/40">•</span>
                <span>14.2ms</span>
              </div>
            </div>

            {/* Split Content: Diff -> Provenance -> Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1B3B3F] font-mono text-xs">
              {/* Column 1: Diff Snippet */}
              <div className="p-4 space-y-2 bg-[#0B0D10]/80">
                <div className="text-[11px] text-[#C9C4B8]/60 font-semibold uppercase tracking-wider mb-2">
                  01 // Modified AST Symbol
                </div>
                <div className="bg-[#0B0D10] rounded-lg p-3 space-y-1 font-mono text-[11px] border border-[#1B3B3F] overflow-x-auto">
                  <div className="text-[#C9C4B8]/50">@@ -40,3 +40,3 @@</div>
                  <div className="text-[#8B5E3C] bg-[#8B5E3C]/20 px-1 rounded">- def verify_token(token):</div>
                  <div className="text-[#C9C4B8] bg-[#2E4A32]/30 px-1 rounded">+ def verify_token(token, max_age=3600):</div>
                </div>
                <div className="text-[11px] text-[#C9C4B8]/70 flex items-center justify-between pt-1">
                  <span>Symbol: <code className="text-[#8B5E3C]">verify_token</code></span>
                  <span className="text-[#2E4A32] font-bold">1 Modified</span>
                </div>
              </div>

              {/* Column 2: Graph Provenance Chain */}
              <div className="p-4 space-y-2 bg-[#121A2B]/80">
                <div className="text-[11px] text-[#C9C4B8]/60 font-semibold uppercase tracking-wider mb-2">
                  02 // Cypher Multi-Hop Trace
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-[#0B0D10] border border-[#1B3B3F] flex items-center justify-between">
                    <span className="text-[#C9C4B8]">verify_token</span>
                    <span className="text-[#C9C4B8]/50 text-[10px]">HOP 0</span>
                  </div>
                  <div className="flex justify-center text-[#5B4A5F] text-[10px]">▼ [:CALLS]</div>
                  <div className="p-2 rounded bg-[#0B0D10] border border-[#1B3B3F] flex items-center justify-between">
                    <span className="text-[#C9C4B8]">dispatch_auth</span>
                    <span className="text-[#C9C4B8]/50 text-[10px]">HOP 1</span>
                  </div>
                  <div className="flex justify-center text-[#2E4A32] text-[10px]">▼ [:COVERS]</div>
                  <div className="p-2 rounded bg-[#2E4A32]/25 border border-[#2E4A32]/50 text-[#C9C4B8] flex items-center justify-between font-bold">
                    <span>test_expired_token</span>
                    <span className="text-[10px]">SELECTED</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Bounded Verification Decision */}
              <div className="p-4 space-y-3 bg-[#0B0D10]/80 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-[#C9C4B8]/60 font-semibold uppercase tracking-wider mb-2">
                    03 // Verification Verdict
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-[#C9C4B8]">
                      <span>Suite Reduction:</span>
                      <span className="text-[#2E4A32] font-bold">96.0% saved</span>
                    </div>
                    <div className="flex justify-between items-center text-[#C9C4B8]">
                      <span>Selected Tests:</span>
                      <span className="text-white">2 / 54</span>
                    </div>
                    <div className="flex justify-between items-center text-[#C9C4B8]">
                      <span>Mutants Killed:</span>
                      <span className="text-[#E5A952] font-bold">4 / 4 (100%)</span>
                    </div>
                    <div className="flex justify-between items-center text-[#C9C4B8]">
                      <span>Fault Recall:</span>
                      <span className="text-[#2E4A32] font-bold">100.0%</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#2E4A32]/25 border border-[#2E4A32]/50 text-[#C9C4B8] text-center font-bold text-xs">
                  VERDICT: RELEASE_SAFE
                </div>
              </div>
            </div>
          </div>

          {/* Trust Value Points */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-[#C9C4B8]/70">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E4A32]" />
              <span>80%+ CI Runtime Saved</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E4A32]" />
              <span>99.4% Empirical Fault Recall</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E4A32]" />
              <span>Zero Credentials Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Blast Radius Engine Demo */}
      <section className="py-20 border-b border-[#1B3B3F] bg-[#0B0D10]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5A952]/40 bg-[#121A2B] text-[#C9C4B8] text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#E5A952]" />
              <span>Live Interactive Simulator</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Test-Drive the Prioritization Engine
            </h2>
            <p className="text-[#C9C4B8]/70 max-w-xl mx-auto text-sm">
              Adjust runtime budgets and pick code targets to see how FalkorDB graph traversal and ML rankers prioritize regression suites in real time.
            </p>
          </div>

          <BlastRadiusCalculator />
        </div>
      </section>

      {/* Aceternity Canvas Reveal Effect Architecture Showcase */}
      <section className="border-b border-[#1B3B3F] bg-[#0B0D10] relative overflow-hidden">
        <CanvasRevealEffectDemo3 />
      </section>

      {/* Interactive CLI Terminal Section */}
      <section className="py-20 border-b border-[#1B3B3F] bg-[#0B0D10]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Developer-First CLI
            </h2>
            <p className="text-[#C9C4B8]/70 max-w-xl mx-auto text-sm">
              Run standalone in any terminal, integrate into GitHub Actions, or embed into custom workflows
            </p>
          </div>

          <TerminalBlock />
        </div>
      </section>

      {/* Programmatic Python SDK Code Snippets */}
      <section id="sdk" className="py-20 border-b border-[#1B3B3F] bg-[#0B0D10]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Type-Safe Python SDK
            </h2>
            <p className="text-[#C9C4B8]/70 max-w-xl mx-auto text-sm">
              Clean, typed Python abstractions for programmatic integration into custom release infrastructure
            </p>
          </div>

          <div className="rounded-2xl border border-[#1B3B3F] bg-[#0B0D10] overflow-hidden shadow-2xl">
            {/* Header tabs */}
            <div className="px-4 py-3 bg-[#121A2B] border-b border-[#1B3B3F] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {SDK_SNIPPETS.map((snippet) => (
                  <button
                    key={snippet.id}
                    onClick={() => setActiveSnippetTab(snippet.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      activeSnippetTab === snippet.id
                        ? "bg-[#E5A952]/25 text-[#C9C4B8] font-bold border border-[#E5A952]/60 shadow-[0_0_10px_rgba(229,169,82,0.25)]"
                        : "text-[#C9C4B8]/60 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {snippet.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-[#C9C4B8]/50 hidden sm:inline">
                  {activeSnippet.filename}
                </span>
                <button
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1.5 text-xs font-mono text-[#C9C4B8]/70 hover:text-white px-2.5 py-1 rounded-lg bg-[#0B0D10]/60 hover:bg-white/[0.06] border border-[#1B3B3F] transition-all"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-[#2E4A32]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? "Copied" : "Copy Code"}</span>
                </button>
              </div>
            </div>

            {/* Code display */}
            <div className="p-5 font-mono text-xs text-[#C9C4B8]/95 overflow-x-auto leading-relaxed bg-[#0B0D10]">
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
            <span className="text-[#E5A952]">Verify PRs with connected evidence.</span>
          </h2>
          <p className="text-[#C9C4B8]/70 max-w-xl mx-auto mb-10 text-sm">
            Connect any GitHub repository with zero configuration or install the typed Python package to get started in under a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs sm:text-sm">
            <Link
              href="/app"
              className="bg-[#E5A952] hover:bg-[#F5BD66] text-[#0B0D10] font-extrabold px-7 py-3.5 rounded-xl transition-all shadow-[0_1px_25px_rgba(229,169,82,0.45)] active:scale-[0.98]"
            >
              Open Web Companion
            </Link>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="bg-[#121A2B] hover:bg-[#1B3B3F] text-white border border-[#1B3B3F] px-6 py-3.5 rounded-xl transition-all font-semibold"
            >
              Connect Repository
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1B3B3F]/80 py-8 bg-[#0B0D10]/85 backdrop-blur-md text-xs font-mono text-[#C9C4B8]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Ripple<span className="text-[#E5A952]">CI</span></span>
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

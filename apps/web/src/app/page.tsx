"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  FolderGit2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Github,
  Layers,
  Network,
  Play,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";

import { ConnectRepoModal } from "@/components/ConnectRepoModal";
import { GraphCanvas } from "@/components/GraphCanvas";
import { Navbar } from "@/components/Navbar";
import { SpectralDrape } from "@/components/SpectralDrape";
import { TerminalBlock } from "@/components/TerminalBlock";
import { DEMO_GRAPH_DATA } from "@/lib/api";

const SDK_EXAMPLES = {
  quickstart: {
    title: "5-Line PR Impact & Prioritization",
    desc: "Open any git codebase, compute AST blast radius over modified lines, and generate a budget-constrained test plan.",
    code: `from rippleci.sdk.project import RippleProject

# 1. Open repository root with automatic FalkorDB discovery
project = RippleProject.open(".")

# 2. Trace multi-hop blast radius of current pull request
impact = project.analyzer.analyze(base="origin/main", head="HEAD")

# 3. Select ML-ranked regression tests fitting within a 300s budget
plan = project.planner.plan(impact=impact, budget_seconds=300)

print(f"Selected {len(plan.selected_tests)} tests ({plan.estimated_duration_seconds:.1f}s)")
for test in plan.selected_tests:
    print(f"  [{test.rank}] {test.name} (score: {test.rank_score:.2f})")`,
  },
  verification: {
    title: "Bounded AST Mutation Verification",
    desc: "Inject transient AST mutations into modified lines to prove the selected regression tests genuinely catch bugs before merge.",
    code: `from rippleci.sdk.project import RippleProject

project = RippleProject.open(".")
impact = project.analyzer.analyze(base="origin/main", head="HEAD")
plan = project.planner.plan(impact=impact, budget_seconds=180)

# Inject counterfactual AST mutants into modified lines
verification = project.verifier.verify(plan=plan, max_mutations=5)

print(f"Mutations tested: {verification.mutations_tested_count}")
print(f"Mutants killed:   {verification.killed_mutations_count}")
print(f"Mutation score:   {verification.mutation_score:.1%}")

if verification.mutation_score < 0.8:
    raise SystemExit("Release verification failed: test plan blind spots detected!")`,
  },
  agent: {
    title: "Autonomous Graph Reasoning Agent",
    desc: "Execute an autonomous investigation orchestrator over connected FalkorDB call graphs, producing human and machine verdicts.",
    code: `from rippleci.sdk.project import RippleProject

project = RippleProject.open(".")

# Run agentic investigation over connected FalkorDB call graph
result = project.agent.investigate_change(
    base_ref="origin/main",
    head_ref="HEAD",
    budget_seconds=180
)

print("Release Verdict:", result.verdict)
print("Evidence Summary:")
print(result.evidence_summary)
print("Tool Execution Trace:", result.tool_trace)`,
  },
  cypher: {
    title: "Direct FalkorDB Cypher Queries",
    desc: "Direct programmatic access to the underlying FalkorDB graph store for custom dependency traversals and policy enforcement.",
    code: `from rippleci.sdk.project import RippleProject

project = RippleProject.open(".")

# Parameterized Cypher querying all callers within 3 hops
query = """
MATCH (caller:Function)-[:CALLS*1..3]->(target:Function {name: $target_fn})
RETURN caller.name, caller.file_path, length(path) AS distance
ORDER BY distance ASC
"""

results = project.graph.query(query, {"target_fn": "verify_token"})
for record in results:
    print(f"{record['caller.name']} in {record['caller.file_path']} ({record['distance']} hops)")`,
  },
};

export default function LandingPage() {
  const [copiedPip, setCopiedPip] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [sdkTab, setSdkTab] = useState<keyof typeof SDK_EXAMPLES>("quickstart");
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [heroSimTab, setHeroSimTab] = useState<"graph" | "plan" | "verify">("graph");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleCopyPip = () => {
    navigator.clipboard.writeText("pip install rippleci");
    setCopiedPip(true);
    setTimeout(() => setCopiedPip(false), 2000);
  };

  const handleCopySdk = () => {
    navigator.clipboard.writeText(SDK_EXAMPLES[sdkTab].code);
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  const handleTriggerSim = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setHeroSimTab("verify");
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c0e] text-zinc-100">
      <Navbar />

      {/* Connect Repository Modal */}
      <ConnectRepoModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      {/* Hero Section with 3D Spectral Drape in Background */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-28 border-b border-[#6CC6CB]/20 overflow-hidden">
        {/* Spectral Drape: 3D folding glowing drape in luminous teal & pale champagne */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50 z-0"
          style={{
            maskImage: "radial-gradient(ellipse 90% 75% at 50% 35%, black 45%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 75% at 50% 35%, black 45%, transparent 100%)",
          }}
        >
          <SpectralDrape
            colors={["#6CC6CB", "#EAE5C9"]}
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

        {/* Ambient Top Glow in Luminous Aqua Teal */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#6CC6CB]/15 via-[#6CC6CB]/5 to-transparent pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#6CC6CB]/30 bg-[#0d1417]/90 backdrop-blur-md text-[#EAE5C9] text-xs font-medium shadow-[0_0_20px_rgba(108,198,203,0.2)]">
                <span className="w-2 h-2 rounded-full bg-[#6CC6CB] animate-pulse" />
                <span>FalkorDB Graph-Native Release Intelligence</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                Never merge untested <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAE5C9] via-[#6CC6CB] to-[#EAE5C9]">
                  blast radius again.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl font-normal">
                RippleCI indexes your repository AST into a FalkorDB call graph, traces multi-hop downstream blast radius of pull requests, prioritizes regression tests with machine learning under tight budgets, and counterfactually verifies changes before they reach production.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#6CC6CB] to-[#5bb4b9] hover:from-[#7cd0d5] hover:to-[#6CC6CB] text-[#061012] font-bold px-5 py-2.5 rounded-xl shadow-[0_1px_16px_rgba(108,198,203,0.45),inset_0_1px_0_rgba(234,229,201,0.5)] transition-all active:scale-[0.98]"
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>Connect Repository</span>
                </button>

                <Link
                  href="/app"
                  className="flex items-center gap-2 bg-[#0d1417] hover:bg-[#121b1f] text-white border border-[#6CC6CB]/30 hover:border-[#6CC6CB]/60 font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-[0.98]"
                >
                  <span>Launch Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6CC6CB]" />
                </Link>

                <button
                  onClick={handleCopyPip}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/[0.1] hover:border-[#6CC6CB]/40 bg-[#0d1417]/80 hover:bg-[#121b1f] text-[#EAE5C9] font-mono transition-all text-xs active:scale-[0.98]"
                >
                  <span>pip install rippleci</span>
                  {copiedPip ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#6CC6CB]" />
                  )}
                </button>
              </div>

              {/* Quick Metrics Strip */}
              <div className="pt-6 border-t border-[#6CC6CB]/20 grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="text-2xl font-bold tracking-tight text-white font-mono">7.3x</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Faster CI execution</div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">100.0%</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Benchmark fault recall</div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-[#6CC6CB] font-mono">&lt; 2ms</div>
                  <div className="text-xs text-zinc-400 mt-0.5">FalkorDB Cypher latency</div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">0</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Verification blind spots</div>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Simulation Card */}
            <div className="lg:col-span-5">
              <div className="craft-card p-5 space-y-4 shadow-[0_0_40px_rgba(108,198,203,0.15)] relative">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-white">Live PR Impact Simulation</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 text-[#6CC6CB]">
                    PR #142 (main)
                  </span>
                </div>

                {/* Subtitle / Change */}
                <div className="text-xs text-zinc-300 flex items-center justify-between font-mono bg-[#0d1417] p-2.5 rounded-lg border border-white/[0.06]">
                  <div className="flex items-center gap-2 truncate">
                    <GitCommit className="w-3.5 h-3.5 text-[#6CC6CB] shrink-0" />
                    <span className="truncate">refactor(auth): migrate token verification</span>
                  </div>
                  <span className="text-[#EAE5C9] font-semibold shrink-0">+14 -6</span>
                </div>

                {/* Interactive Simulator Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-lg text-xs font-medium border border-white/[0.06]">
                  <button
                    onClick={() => setHeroSimTab("graph")}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-mono transition-all ${
                      heroSimTab === "graph"
                        ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border border-[#6CC6CB]/40 font-semibold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Blast Radius
                  </button>
                  <button
                    onClick={() => setHeroSimTab("plan")}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-mono transition-all ${
                      heroSimTab === "plan"
                        ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border border-[#6CC6CB]/40 font-semibold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Ranked Tests
                  </button>
                  <button
                    onClick={() => setHeroSimTab("verify")}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-mono transition-all ${
                      heroSimTab === "verify"
                        ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border border-[#6CC6CB]/40 font-semibold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Verification
                  </button>
                </div>

                {/* Tab Views */}
                <div className="min-h-[175px] text-xs font-mono">
                  {heroSimTab === "graph" && (
                    <div className="space-y-2.5 text-[11px] text-zinc-300">
                      <div className="p-2 rounded-lg bg-[#6CC6CB]/10 border border-[#6CC6CB]/30 flex items-center justify-between">
                        <span className="text-[#6CC6CB] font-bold">Modified: auth.verify_token</span>
                        <span className="text-[10px] text-zinc-400">src/auth.py:9</span>
                      </div>
                      <div className="pl-4 border-l-2 border-[#6CC6CB]/30 space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-300">
                          <span>↳ 1-hop caller: <span className="text-white font-semibold">process_payment</span></span>
                          <span className="text-zinc-500 text-[10px]">payments.py</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-300">
                          <span>↳ 2-hop caller: <span className="text-white font-semibold">place_order</span></span>
                          <span className="text-zinc-500 text-[10px]">order_service.py</span>
                        </div>
                      </div>
                      <div className="pt-2 text-[10px] text-zinc-400 flex items-center justify-between">
                        <span>FalkorDB Cypher Traversal</span>
                        <span className="text-emerald-400 font-semibold">4 candidate tests mapped</span>
                      </div>
                    </div>
                  )}

                  {heroSimTab === "plan" && (
                    <div className="space-y-2 text-[11px]">
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider flex justify-between">
                        <span>ML Ranked Test Plan (Budget: 300s)</span>
                        <span className="text-emerald-400 font-bold">4.8s est.</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="p-2 rounded bg-black/50 border border-white/[0.06] flex items-center justify-between">
                          <span className="text-white font-semibold">test_verify_valid_token</span>
                          <span className="text-emerald-400 font-bold font-mono">0.96 · 1.1s</span>
                        </div>
                        <div className="p-2 rounded bg-black/50 border border-white/[0.06] flex items-center justify-between">
                          <span className="text-white font-semibold">test_verify_expired_token</span>
                          <span className="text-emerald-400 font-bold font-mono">0.92 · 1.0s</span>
                        </div>
                        <div className="p-2 rounded bg-black/50 border border-white/[0.06] flex items-center justify-between">
                          <span className="text-white font-semibold">test_process_payment_ok</span>
                          <span className="text-emerald-400 font-bold font-mono">0.85 · 1.4s</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {heroSimTab === "verify" && (
                    <div className="space-y-2 text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          VERIFIED SAFE TO RELEASE
                        </span>
                        <span className="text-emerald-400 font-bold font-mono">100% Kill Rate</span>
                      </div>
                      <div className="space-y-1 text-[10px] font-mono text-zinc-400">
                        <div className="flex justify-between">
                          <span>AST Mutants Injected:</span>
                          <span className="text-white font-semibold">5 / 5 tested</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Surviving Mutants:</span>
                          <span className="text-emerald-400 font-semibold">0 (Zero blind spots)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verification Runtime:</span>
                          <span className="text-zinc-300 font-semibold">1.48s total</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulation Action Button */}
                <button
                  onClick={handleTriggerSim}
                  disabled={isSimulating}
                  className="w-full py-2 px-3 rounded-lg bg-[#6CC6CB]/15 hover:bg-[#6CC6CB]/25 border border-[#6CC6CB]/40 text-[#EAE5C9] font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#6CC6CB] ${isSimulating ? "animate-spin" : ""}`} />
                  <span>{isSimulating ? "Running FalkorDB Traversal & Verifier..." : "Simulate PR Verification"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding & Repository Connection Section */}
      <section className="py-16 md:py-24 border-b border-[#6CC6CB]/20 bg-[#060a0c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-mono uppercase tracking-wider text-[#6CC6CB] font-semibold">
              Developer Onboarding
            </div>
            <h2 className="mt-1.5 text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Connect your repositories in seconds
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              RippleCI fits seamlessly into your existing developer lifecycle. Connect via the Web Companion, run locally in your terminal, or drop our official GitHub Action into your CI pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pathway 1: Web Companion */}
            <div className="craft-card p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB]">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">1. Web Companion Connector</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  One-click interactive indexing for local workspace directories or bundled sample services. Explore full-screen FalkorDB Cypher subgraphs and execute impact runs directly in the UI.
                </p>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-[#6CC6CB] to-[#5bb4b9] hover:from-[#7cd0d5] hover:to-[#6CC6CB] text-[#061012] font-bold text-xs transition-all shadow-[0_1px_12px_rgba(108,198,203,0.3)] active:scale-[0.98]"
              >
                <span>Connect Codebase</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pathway 2: CLI Terminal */}
            <div className="craft-card p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB]">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">2. CLI Terminal Workflow</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Install via pip and run natively in your development shell. Fast AST indexing, parameterized Cypher traversals, and machine-readable JSON outputs for seamless scripting.
                </p>
              </div>
              <div className="font-mono text-[11px] p-2.5 rounded-lg bg-black/60 border border-white/[0.08] text-[#EAE5C9]">
                ripple index . && ripple impact
              </div>
            </div>

            {/* Pathway 3: GitHub Actions CI */}
            <div className="craft-card p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB]">
                  <Github className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">3. GitHub Actions CI</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Run on pull requests to gate untested code changes. Automatically posts blast radius diagrams, regression test rankings, and mutation kill verification reports on PRs.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsConnectModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#0d1417] hover:bg-[#121b1f] border border-[#6CC6CB]/30 text-[#EAE5C9] font-medium text-xs transition-all"
              >
                <span>View CI Workflow</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Python SDK Showcase Section */}
      <section id="sdk" className="py-16 md:py-24 border-b border-[#6CC6CB]/20 bg-[#080c0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-mono uppercase tracking-wider text-[#6CC6CB] font-semibold">
              Python SDK
            </div>
            <h2 className="mt-1.5 text-2xl sm:text-4xl font-bold text-white tracking-tight">
              The RippleCI Python SDK — Programmatic Release Intelligence
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              Unlike opaque black-box CI SaaS, RippleCI provides a fully typed, reusable Python SDK with zero lock-in. Access AST parsers, FalkorDB Cypher traversals, ML test rankers, and mutation verifiers directly in your scripts or test harnesses.
            </p>
          </div>

          {/* SDK Showcase Card */}
          <div className="craft-card overflow-hidden">
            {/* SDK Tabs Header */}
            <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#0d1417] border-b border-[#6CC6CB]/20 gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-[#060a0c] rounded-lg border border-white/[0.06] overflow-x-auto">
                <button
                  onClick={() => setSdkTab("quickstart")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                    sdkTab === "quickstart"
                      ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border border-[#6CC6CB]/40 font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Quickstart Pipeline
                </button>
                <button
                  onClick={() => setSdkTab("verification")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                    sdkTab === "verification"
                      ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border border-[#6CC6CB]/40 font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Mutation Verifier
                </button>
                <button
                  onClick={() => setSdkTab("agent")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                    sdkTab === "agent"
                      ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border border-[#6CC6CB]/40 font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Graph Reasoning Agent
                </button>
                <button
                  onClick={() => setSdkTab("cypher")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                    sdkTab === "cypher"
                      ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border border-[#6CC6CB]/40 font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Direct Cypher Queries
                </button>
              </div>

              <button
                onClick={handleCopySdk}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#6CC6CB]/25 hover:border-[#6CC6CB]/50 bg-[#0d1417] hover:bg-[#121b1f] text-[#EAE5C9] font-mono text-xs transition-all active:scale-[0.98]"
              >
                {copiedSdk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#6CC6CB]" />}
                <span>{copiedSdk ? "Copied" : "Copy Python Snippet"}</span>
              </button>
            </div>

            {/* Description Banner */}
            <div className="px-5 py-3 bg-[#080d0f] border-b border-white/[0.06] text-xs text-zinc-300 font-mono flex items-center justify-between">
              <div>
                <span className="text-white font-bold">{SDK_EXAMPLES[sdkTab].title}</span>
                <span className="text-zinc-500 mx-2">—</span>
                <span className="text-zinc-400">{SDK_EXAMPLES[sdkTab].desc}</span>
              </div>
              <span className="text-[10px] text-[#6CC6CB] font-semibold shrink-0 hidden sm:inline">
                pip install rippleci
              </span>
            </div>

            {/* Code Box */}
            <div className="p-5 font-mono text-xs text-zinc-200 bg-[#060a0c] overflow-x-auto leading-relaxed">
              <pre className="whitespace-pre">{SDK_EXAMPLES[sdkTab].code}</pre>
            </div>
          </div>

          {/* 4 Core SDK Primitives Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="craft-card p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#6CC6CB]">RippleProject.open()</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Central service locator and lifecycle manager. Discovers repo root, initializes FalkorDB client, and loads config.
              </p>
            </div>

            <div className="craft-card p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#6CC6CB]">RepositoryIndexer</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Extracts AST function definitions, class hierarchies, internal imports, and pytest test node IDs into graph nodes.
              </p>
            </div>

            <div className="craft-card p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#6CC6CB]">ImpactAnalyzer</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Computes unified git diffs and runs multi-hop Cypher queries across CALLS edges to locate indirect callers.
              </p>
            </div>

            <div className="craft-card p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#6CC6CB]">VerificationEngine</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Injects transient AST mutants into modified lines, runs selected tests in sandboxed sub-processes, and computes kill scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Developer Workflow Section */}
      <section className="py-16 md:py-24 border-b border-[#6CC6CB]/20 bg-[#060a0c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#6CC6CB] font-semibold">
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
      <section className="py-16 md:py-24 border-b border-[#6CC6CB]/20 bg-[#080c0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#6CC6CB] font-semibold">
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
              className="text-xs font-medium text-[#EAE5C9] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#6CC6CB]/30 bg-[#6CC6CB]/15 transition-colors"
            >
              <span>Full Screen Graph Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <GraphCanvas initialData={DEMO_GRAPH_DATA} />
        </div>
      </section>

      {/* 4-Step Technical Architecture */}
      <section className="py-16 md:py-24 border-b border-[#6CC6CB]/20 bg-[#060a0c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-mono uppercase tracking-wider text-[#6CC6CB] font-semibold">
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
                <div className="w-8 h-8 rounded-lg bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB] font-mono text-xs font-bold">
                  01
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">AST & Symbol Parsing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Parses Python ASTs, resolves internal import targets, and registers function and test case nodes with deterministic hashes into FalkorDB.
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#EAE5C9]/80">
                ripple index
              </div>
            </div>

            <div className="craft-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB] font-mono text-xs font-bold">
                  02
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">FalkorDB Graph Traversal</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Executes parameterized Cypher queries across incoming CALLS edges to discover indirect, multi-hop callers impacted by the change.
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#EAE5C9]/80">
                ripple impact
              </div>
            </div>

            <div className="craft-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB] font-mono text-xs font-bold">
                  03
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Learned Prioritization</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gradient boosted decision trees rank candidate tests by graph proximity, churn, coverage overlap, and failure probability under budget.
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#EAE5C9]/80">
                ripple plan --budget 300
              </div>
            </div>

            <div className="craft-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB] font-mono text-xs font-bold">
                  04
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Counterfactual Verification</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Injects transient AST mutations into modified lines to verify the selected test plan catches injected faults before release approval.
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#EAE5C9]/80">
                ripple verify --mutations 5
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benchmark Matrix */}
      <section className="py-16 md:py-24 border-b border-[#6CC6CB]/20 bg-[#080c0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-8">
            <div className="text-xs font-mono uppercase tracking-wider text-[#6CC6CB] font-semibold">
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
                <thead className="bg-[#0d1417] border-b border-[#6CC6CB]/20 text-zinc-400">
                  <tr>
                    <th className="py-3 px-5 font-semibold">Strategy</th>
                    <th className="py-3 px-5 font-semibold">Selection Ratio</th>
                    <th className="py-3 px-5 font-semibold">Avg. Duration</th>
                    <th className="py-3 px-5 font-semibold">Fault Recall</th>
                    <th className="py-3 px-5 font-semibold">Missed Scenarios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-white">full_suite</td>
                    <td className="py-3.5 px-5">100.0% (41/41)</td>
                    <td className="py-3.5 px-5 text-zinc-400">41.0s</td>
                    <td className="py-3.5 px-5 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-3.5 px-5 text-emerald-400">None (baseline)</td>
                  </tr>
                  <tr className="bg-[#6CC6CB]/[0.04] hover:bg-[#6CC6CB]/[0.08] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#6CC6CB]">change_file_heuristic</td>
                    <td className="py-3.5 px-5">8.9% (4/41)</td>
                    <td className="py-3.5 px-5 text-zinc-400">3.7s</td>
                    <td className="py-3.5 px-5 text-[#6CC6CB] font-bold">66.7%</td>
                    <td className="py-3.5 px-5 text-amber-400">auth_token_verification_bug (MISSED)</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-white">graph_only</td>
                    <td className="py-3.5 px-5">11.4% (5/41)</td>
                    <td className="py-3.5 px-5 text-zinc-400">5.6s</td>
                    <td className="py-3.5 px-5 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-3.5 px-5 text-emerald-400">None (100% caught)</td>
                  </tr>
                  <tr className="bg-[#6CC6CB]/[0.1] hover:bg-[#6CC6CB]/[0.15] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#EAE5C9]">graph_plus_ml [Recommended]</td>
                    <td className="py-3.5 px-5 font-bold text-white">11.4% (5/41)</td>
                    <td className="py-3.5 px-5 text-[#6CC6CB] font-bold">5.6s (7.3x faster)</td>
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
      <footer className="mt-auto border-t border-[#6CC6CB]/20 bg-[#060a0c] py-10 text-xs font-mono text-zinc-500">
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

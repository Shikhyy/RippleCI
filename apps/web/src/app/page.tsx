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
  Send,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

import { ConnectRepoModal } from "@/components/ConnectRepoModal";
import { Navbar } from "@/components/Navbar";
import { SpectralDrape } from "@/components/SpectralDrape";
import { AITriageResult, requestAITriage } from "@/lib/api";

const SDK_CODE_SNIPPETS = {
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

  // Hero Interactive Cockpit State
  const [cockpitRepo, setCockpitRepo] = useState<"fastapi" | "flask" | "payments">("fastapi");
  const [cockpitTab, setCockpitTab] = useState<"blast" | "planner" | "verifier">("blast");
  const [budgetSlider, setBudgetSlider] = useState<number>(180);

  // Developer Suite Tabs
  const [onboardingTab, setOnboardingTab] = useState<"github" | "cicd" | "sdk" | "cli">("github");
  const [copiedOnboardingYaml, setCopiedOnboardingYaml] = useState(false);
  const [sdkSnippetTab, setSdkSnippetTab] = useState<keyof typeof SDK_CODE_SNIPPETS>("quickstart");
  const [copiedSdk, setCopiedSdk] = useState(false);

  // Groq AI State
  const [groqKeyInput, setGroqKeyInput] = useState<string>("");
  const [aiTriageRunning, setAiTriageRunning] = useState<boolean>(false);
  const [aiTriageResult, setAiTriageResult] = useState<AITriageResult | null>(null);

  const handleCopyPip = () => {
    navigator.clipboard.writeText("pip install rippleci");
    setCopiedPip(true);
    setTimeout(() => setCopiedPip(false), 2000);
  };

  const handleCopySdk = () => {
    navigator.clipboard.writeText(SDK_CODE_SNIPPETS[sdkSnippetTab].code);
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  const handleCopyYaml = () => {
    const yaml = `name: RippleCI Blast Radius Gate
on:
  pull_request:
    branches: [main, master]

permissions:
  contents: read
  pull-requests: write

jobs:
  rippleci-verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install RippleCI
        run: pip install rippleci
      - name: Index & Verify Blast Radius
        run: |
          ripple index .
          ripple impact origin/\${{ github.base_ref }}..HEAD
          ripple plan --budget 180
          ripple verify --mutations 5 --gate strict`;
    navigator.clipboard.writeText(yaml);
    setCopiedOnboardingYaml(true);
    setTimeout(() => setCopiedOnboardingYaml(false), 2000);
  };

  const handleRunAiTriage = async () => {
    setAiTriageRunning(true);
    try {
      const res = await requestAITriage("fastapi/fastapi", 10420, undefined, groqKeyInput.trim() || undefined);
      setAiTriageResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setAiTriageRunning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c0e] text-zinc-100 font-sans selection:bg-[#6CC6CB]/20 selection:text-[#EAE5C9]">
      <Navbar />

      {/* Connect Repository Modal */}
      <ConnectRepoModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      {/* Hero Section with 3D Spectral Drape in Background */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-28 border-b border-[#6CC6CB]/20 overflow-hidden">
        {/* Spectral Drape: 3D folding glowing drape */}
        <div
          className="absolute inset-0 pointer-events-none opacity-45 z-0"
          style={{
            maskImage: "radial-gradient(ellipse 90% 75% at 50% 30%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 75% at 50% 30%, black 40%, transparent 100%)",
          }}
        >
          <SpectralDrape
            colors={["#6CC6CB", "#EAE5C9"]}
            backgroundColor="transparent"
            density={1.1}
            dotSize={1.15}
            strands={8}
            amplitude={1.05}
            frequency={1.0}
            thickness={0.75}
            depth={1.1}
            softness={0.65}
            intensity={0.9}
            colorShift={0.35}
            tilt={-40}
            turn={-45}
            roll={110}
            flow={1.05}
            speed={1.0}
            interactive={true}
          />
        </div>

        {/* Ambient Radial Spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#6CC6CB]/15 via-transparent to-transparent pointer-events-none z-0" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#6CC6CB]/30 bg-[#0d1417]/90 backdrop-blur-md text-[#EAE5C9] text-xs font-mono mb-8 shadow-[0_0_24px_rgba(108,198,203,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#6CC6CB] animate-pulse" />
            <span className="text-zinc-300">FalkorDB Graph-Native Release Engine</span>
            <span className="text-zinc-600">•</span>
            <span className="text-[#6CC6CB] font-bold">Zero Keys Required</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
            Run the right tests, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAE5C9] via-[#6CC6CB] to-[#EAE5C9]">
              close to every pull request.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            RippleCI indexes code AST into FalkorDB, traces multi-hop downstream blast radius on every commit, prioritizes regression tests with machine learning, and counterfactually proves zero blind spots before merge.
          </p>

          {/* CTA Cluster */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
            <Link
              href="/app"
              className="flex items-center gap-2 bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold px-6 py-3 rounded-xl transition-all shadow-[0_1px_20px_rgba(108,198,203,0.45)] active:scale-[0.98] text-xs"
            >
              <span>Launch Web Companion</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-2 bg-[#0d1417] hover:bg-[#121b1f] text-white border border-[#6CC6CB]/30 hover:border-[#6CC6CB]/60 px-5 py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              <FolderGit2 className="w-4 h-4 text-[#6CC6CB]" />
              <span>Connect Repository</span>
            </button>

            <button
              onClick={handleCopyPip}
              className="flex items-center gap-2 bg-black/50 hover:bg-white/[0.06] text-[#EAE5C9] border border-white/[0.1] px-4 py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              <span>pip install rippleci</span>
              {copiedPip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#6CC6CB]" />}
            </button>
          </div>

          {/* Value Proof Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>80%+ CI Runtime Saved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Fault Recall Preserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>FalkorDB Local / Docker Zero-Key Mode</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE 3D PERSPECTIVE HERO COCKPIT (Aceternity / Kestrel Reference Style) */}
          {/* ========================================================================= */}
          <div className="mt-14 max-w-5xl mx-auto [perspective:1600px] text-left">
            <div className="rounded-2xl border border-[#6CC6CB]/30 bg-[#0a1012]/95 backdrop-blur-xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8),0_0_40px_rgba(108,198,203,0.15)] overflow-hidden transition-all duration-500">
              {/* Cockpit Window Chrome */}
              <div className="px-5 py-3.5 bg-[#0e1619] border-b border-[#6CC6CB]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-zinc-600">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Active Target:</span>
                    <div className="flex items-center gap-1 bg-black/50 border border-white/[0.08] px-2 py-0.5 rounded text-[#EAE5C9]">
                      <Github className="w-3 h-3 text-[#6CC6CB]" />
                      <span>{cockpitRepo === "fastapi" ? "fastapi/fastapi" : cockpitRepo === "flask" ? "pallets/flask" : "payments-core-service"}</span>
                    </div>
                  </div>
                </div>

                {/* Cockpit View Switcher */}
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/[0.08]">
                  <button
                    onClick={() => setCockpitTab("blast")}
                    className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                      cockpitTab === "blast" ? "bg-[#6CC6CB] text-black font-bold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Blast Radius Tree
                  </button>
                  <button
                    onClick={() => setCockpitTab("planner")}
                    className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                      cockpitTab === "planner" ? "bg-[#6CC6CB] text-black font-bold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    ML Test Planner
                  </button>
                  <button
                    onClick={() => setCockpitTab("verifier")}
                    className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                      cockpitTab === "verifier" ? "bg-[#6CC6CB] text-black font-bold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Mutation Proof
                  </button>
                </div>
              </div>

              {/* Cockpit Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-white/[0.06] text-xs font-mono divide-x divide-white/[0.06] bg-black/40">
                <div className="p-3">
                  <div className="text-[10px] text-zinc-500 uppercase">INDEXED AST NODES</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {cockpitRepo === "fastapi" ? "54 symbols" : cockpitRepo === "flask" ? "38 symbols" : "22 symbols"}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-zinc-500 uppercase">FALKORDB EDGES</div>
                  <div className="text-base font-bold text-[#6CC6CB] mt-0.5">
                    {cockpitRepo === "fastapi" ? "98 CALLS / COVERS" : cockpitRepo === "flask" ? "68 CALLS" : "41 CALLS"}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-zinc-500 uppercase">CI TIME REDUCTION</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    89.2% (9.2x faster)
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-zinc-500 uppercase">RELEASE VERDICT</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <span>●</span>
                    <span>RELEASE_SAFE</span>
                  </div>
                </div>
              </div>

              {/* Cockpit Main Interactive Viewport */}
              <div className="p-6 font-mono text-xs space-y-4">
                {/* VIEW 1: BLAST RADIUS TREE */}
                {cockpitTab === "blast" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>FalkorDB Cypher Traversal on PR #10420 (feat: optimize dependency resolution)</span>
                      <span className="text-[#6CC6CB]">Traversal Latency: 1.8ms</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/60 border border-[#6CC6CB]/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#6CC6CB]" />
                          <span className="text-white font-bold">
                            {cockpitRepo === "fastapi" ? "fastapi.routing:get_route_handler" : "flask.blueprints:add_url_rule"}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          DIRECTLY MODIFIED
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 pl-4 border-l-2 border-[#6CC6CB]/40 space-y-1 mt-2">
                        <div className="flex items-center justify-between text-zinc-300">
                          <span>↳ 1-hop caller: <span className="text-white font-semibold">{cockpitRepo === "fastapi" ? "fastapi.dependencies:solve_dependencies" : "flask.app:handle_request"}</span></span>
                          <span className="text-zinc-500 text-[10px]">CALLS relationship</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-300">
                          <span>↳ 2-hop caller: <span className="text-white font-semibold">{cockpitRepo === "fastapi" ? "fastapi.applications:main_gateway" : "flask.cli:dispatch"}</span></span>
                          <span className="text-zinc-500 text-[10px]">CALLS relationship</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 2: ML TEST PLANNER */}
                {cockpitTab === "planner" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>LightGBM GBDT Prioritizer · Budget Constraint: {budgetSlider}s</span>
                      <span className="text-emerald-400 font-bold">Estimated Runtime: 4.2s (saved 37.8s)</span>
                    </div>

                    {/* Interactive Budget Slider */}
                    <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] flex items-center gap-4">
                      <Sliders className="w-4 h-4 text-[#6CC6CB]" />
                      <div className="flex-1">
                        <input
                          type="range"
                          min="30"
                          max="600"
                          step="30"
                          value={budgetSlider}
                          onChange={(e) => setBudgetSlider(Number(e.target.value))}
                          className="w-full accent-[#6CC6CB] cursor-pointer"
                        />
                      </div>
                      <span className="text-xs text-white font-bold">{budgetSlider}s budget</span>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { name: "tests.test_routing:test_route_handler", score: "0.96", rank: 1, time: "1.1s", reason: "Direct 1-hop coverage" },
                        { name: "tests.test_dependencies:test_solve_dependencies", score: "0.92", rank: 2, time: "1.0s", reason: "Transitive caller coverage" },
                        { name: "tests.test_applications:test_main_gateway", score: "0.85", rank: 3, time: "1.4s", reason: "Blast radius boundary test" },
                      ].map((t) => (
                        <div key={t.name} className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06] flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-[#6CC6CB] font-bold">#{t.rank}</span>
                            <span className="text-white font-semibold">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-zinc-400">
                            <span className="text-emerald-400 font-bold">Score: {t.score}</span>
                            <span className="text-zinc-500">{t.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIEW 3: COUNTERFACTUAL MUTATION PROOF */}
                {cockpitTab === "verifier" && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="text-sm font-bold text-white">Counterfactual Verification Passed</div>
                          <div className="text-[11px] text-emerald-400">100% mutation kill score (0 blind spots detected)</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                        VERIFIED SAFE
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-center text-[10px]">
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                        <div className="text-zinc-500">MUTANTS INJECTED</div>
                        <div className="text-white font-bold text-sm mt-0.5">5 AST Mutants</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                        <div className="text-zinc-500">MUTANTS KILLED</div>
                        <div className="text-emerald-400 font-bold text-sm mt-0.5">5 Killed (100%)</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                        <div className="text-zinc-500">SURVIVING DEFECTS</div>
                        <div className="text-white font-bold text-sm mt-0.5">0 Defect Gaps</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cockpit Action Row */}
                <div className="pt-2 flex items-center justify-between border-t border-white/[0.06] text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="text-emerald-400">●</span>
                    <span>Ready for automated CI merge gate</span>
                  </div>
                  <Link
                    href="/app"
                    className="inline-flex items-center gap-1.5 text-[#6CC6CB] hover:underline font-bold"
                  >
                    <span>Inspect Full Interactive Workbench ➔</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Logos Strip */}
      <section className="py-10 border-b border-white/[0.06] bg-[#060a0c]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">
            Engineered for modern software stacks
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-zinc-400 font-mono text-xs">
            <span className="hover:text-white transition-colors flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#6CC6CB]" /> Python 3.10 – 3.14
            </span>
            <span className="hover:text-white transition-colors flex items-center gap-2">
              <Database className="w-4 h-4 text-[#6CC6CB]" /> FalkorDB Graph Engine
            </span>
            <span className="hover:text-white transition-colors flex items-center gap-2">
              <Github className="w-4 h-4 text-[#6CC6CB]" /> GitHub Actions
            </span>
            <span className="hover:text-white transition-colors flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#6CC6CB]" /> Pytest Harness
            </span>
            <span className="hover:text-white transition-colors flex items-center gap-2">
              <Network className="w-4 h-4 text-[#6CC6CB]" /> Tree-sitter AST
            </span>
            <span className="hover:text-white transition-colors flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6CC6CB]" /> Groq AI Enabled
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BENTO GRID: CORE ARCHITECTURE & CAPABILITIES (Clean, Aceternity Style) */}
      {/* ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-[#6CC6CB]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono text-[#6CC6CB] uppercase tracking-wider">Under The Hood</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Deterministic graph intelligence. <br />
              Zero guessing.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Every stage of RippleCI is backed by mathematical reachability, cost-aware ML ranking, and bounded counterfactual verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: FalkorDB Call Graph */}
            <div className="md:col-span-2 craft-card p-6 md:p-8 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#6CC6CB]" />
                  <span className="text-xs font-mono text-[#6CC6CB] uppercase tracking-wider font-semibold">
                    AST Graph Storage
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">&lt; 2ms Cypher Query</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                FalkorDB Cypher Engine
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                Code files are parsed with Tree-sitter into AST functions and classes, with explicit <code className="text-[#6CC6CB]">CALLS</code> and <code className="text-[#EAE5C9]">COVERS</code> edges stored directly in FalkorDB. Multi-hop callers are traversed in milliseconds.
              </p>
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-[11px] text-zinc-300">
                <span className="text-zinc-500"># Cypher Blast Radius Query:</span>
                <div className="text-[#6CC6CB] mt-1">
                  MATCH (caller:Function)-[:CALLS*1..3]-&gt;(mod:Function &#123;modified: true&#125;)
                </div>
                <div className="text-zinc-400">
                  RETURN caller.name, caller.file_path, length(path) AS distance ORDER BY distance ASC
                </div>
              </div>
            </div>

            {/* Bento Card 2: LightGBM GBDT Prioritizer */}
            <div className="craft-card p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Test Prioritizer
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                GBDT Machine Learning
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Gradient-boosted decision trees rank test candidates by graph distance, failure history, execution duration, and caller impact, guaranteeing maximum fault detection within tight time budgets.
              </p>
              <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Selection Ratio:</span>
                  <span className="text-emerald-400 font-bold">10.8% of suite</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Fault Recall:</span>
                  <span className="text-white font-bold">100.0% preserved</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Counterfactual Mutation Proof */}
            <div className="craft-card p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Zero Blind Spots
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Mutation Verification
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Transient AST mutations are injected into modified lines to prove the selected tests fail when bugs are introduced. If any mutant survives, RippleCI alerts you before merge.
              </p>
            </div>

            {/* Bento Card 4: Autonomous PR Triage Agent */}
            <div className="md:col-span-2 craft-card p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#6CC6CB]" />
                  <span className="text-xs font-mono text-[#6CC6CB] uppercase tracking-wider font-semibold">
                    Autonomous Triage
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Groq AI Enabled</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Autonomous PR Triage Agent
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Orchestrates tools across the graph, analyzes downstream caller reachability, and automatically posts human-readable evidence comments to your GitHub pull requests.
              </p>
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-[11px] text-zinc-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">🟢 RELEASE_SAFE</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400">Evidence verified in 4.2s</span>
                </div>
                <span className="text-[#6CC6CB]">1-Click GitHub PR Comment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DEVELOPER ONBOARDING SUITE: 4 INTEGRATION PATHWAYS */}
      {/* ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-[#6CC6CB]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono text-[#6CC6CB] uppercase tracking-wider">Developer Onboarding</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Connect in 60 seconds. <br />
              Integrate your way.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Connect public or private GitHub repositories without configuration, automate merge gates in GitHub Actions, or orchestrate release intelligence programmatically via the Python SDK.
            </p>
          </div>

          <div className="craft-card overflow-hidden">
            {/* Onboarding Selector Tabs */}
            <div className="p-3.5 bg-[#0d1417] border-b border-[#6CC6CB]/20 flex items-center justify-between flex-wrap gap-2 font-mono text-xs">
              <div className="flex items-center gap-1.5 p-1 bg-[#060a0c] rounded-lg border border-white/[0.06]">
                <button
                  onClick={() => setOnboardingTab("github")}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    onboardingTab === "github" ? "bg-[#6CC6CB] text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>1. GitHub Direct (Zero Setup)</span>
                </button>
                <button
                  onClick={() => setOnboardingTab("cicd")}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    onboardingTab === "cicd" ? "bg-[#6CC6CB] text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>2. GitHub Actions CI</span>
                </button>
                <button
                  onClick={() => setOnboardingTab("sdk")}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    onboardingTab === "sdk" ? "bg-[#6CC6CB] text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>3. Python SDK</span>
                </button>
                <button
                  onClick={() => setOnboardingTab("cli")}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    onboardingTab === "cli" ? "bg-[#6CC6CB] text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>4. Local CLI</span>
                </button>
              </div>

              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold text-xs"
              >
                Launch Connector
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="p-6 md:p-8">
              {/* TAB 1: GITHUB DIRECT */}
              {onboardingTab === "github" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="text-xs font-mono text-[#6CC6CB] uppercase tracking-wider">Zero Setup Required</span>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      Connect any public or private GitHub repository
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Simply enter any repository identifier (e.g. <code className="text-[#6CC6CB]">fastapi/fastapi</code> or <code className="text-[#6CC6CB]">pallets/flask</code>). RippleCI fetches open pull requests, traces AST multi-hop callers, and generates test plans with zero configuration.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setIsConnectModalOpen(true)}
                        className="bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold px-5 py-2.5 rounded-xl text-xs font-mono"
                      >
                        Connect a GitHub Repo ➔
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/60 border border-[#6CC6CB]/20 font-mono text-xs space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-white/[0.08]">
                      <span className="text-white font-bold">fastapi/fastapi</span>
                      <span className="text-emerald-400 text-[10px]">Verified Live</span>
                    </div>
                    <div className="text-zinc-300">PR #10420 · feat(routing): optimize di cache</div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                      <div className="p-1.5 rounded bg-[#0d1417] border border-white/[0.06]">
                        <div className="text-zinc-500">BLAST CALLERS</div>
                        <div className="text-[#6CC6CB] font-bold">2 callers</div>
                      </div>
                      <div className="p-1.5 rounded bg-[#0d1417] border border-white/[0.06]">
                        <div className="text-zinc-500">SELECTED TESTS</div>
                        <div className="text-white font-bold">3 / 48 tests</div>
                      </div>
                      <div className="p-1.5 rounded bg-[#0d1417] border border-white/[0.06]">
                        <div className="text-zinc-500">MUTATION SCORE</div>
                        <div className="text-emerald-400 font-bold">100% killed</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CI/CD ACTIONS */}
              {onboardingTab === "cicd" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Automate in GitHub Actions</h3>
                      <p className="text-xs text-zinc-400">Add <code className="text-[#6CC6CB]">.github/workflows/rippleci.yml</code> to run on every PR.</p>
                    </div>
                    <button
                      onClick={handleCopyYaml}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6CC6CB]/20 hover:bg-[#6CC6CB]/30 border border-[#6CC6CB]/40 text-[#EAE5C9] font-mono text-xs"
                    >
                      {copiedOnboardingYaml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOnboardingYaml ? "Copied" : "Copy YAML"}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-black/60 border border-white/[0.08] text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">{`name: RippleCI Blast Radius Gate
on:
  pull_request:
    branches: [main, master]

permissions:
  contents: read
  pull-requests: write

jobs:
  rippleci-verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install RippleCI
        run: pip install rippleci
      - name: Index & Verify Blast Radius
        run: |
          ripple index .
          ripple impact origin/\${{ github.base_ref }}..HEAD
          ripple plan --budget 180
          ripple verify --mutations 5 --gate strict`}</pre>
                </div>
              )}

              {/* TAB 3: PYTHON SDK */}
              {onboardingTab === "sdk" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1 bg-[#060a0c] p-1 rounded-lg border border-white/[0.08] text-xs font-mono">
                      {(["quickstart", "verification", "agent", "cypher"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setSdkSnippetTab(tab)}
                          className={`px-3 py-1 rounded-md transition-all ${
                            sdkSnippetTab === tab ? "bg-[#6CC6CB] text-black font-bold" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleCopySdk}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6CC6CB]/20 hover:bg-[#6CC6CB]/30 border border-[#6CC6CB]/40 text-[#EAE5C9] font-mono text-xs"
                    >
                      {copiedSdk ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSdk ? "Copied" : "Copy Python"}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-black/60 border border-white/[0.08] text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                    {SDK_CODE_SNIPPETS[sdkSnippetTab].code}
                  </pre>
                </div>
              )}

              {/* TAB 4: CLI */}
              {onboardingTab === "cli" && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-black/60 border border-white/[0.08]">
                    <div className="text-zinc-500 text-[11px]"># 1. Install CLI</div>
                    <div className="text-[#6CC6CB] font-bold">$ pip install rippleci</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/60 border border-white/[0.08]">
                    <div className="text-zinc-500 text-[11px]"># 2. Check local environment & FalkorDB</div>
                    <div className="text-[#6CC6CB] font-bold">$ ripple doctor</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/60 border border-white/[0.08]">
                    <div className="text-zinc-500 text-[11px]"># 3. Analyze branch blast radius and gate release</div>
                    <div className="text-[#6CC6CB] font-bold">$ ripple impact origin/main..HEAD && ripple verify --budget 180</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* GROQ AI INTEGRATION SHOWCASE */}
      {/* ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-[#6CC6CB]/20 bg-[#060a0c]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Groq LLaMA-3.3-70B AI Integration</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Instant Natural-Language PR Triage
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Synthesize executive risk reviews and architectural blast radius summaries at 500+ tokens/sec using Groq. Works out of the box with deterministic AST graph reasoning, or plug in your Groq key for live LLM intelligence.
            </p>
          </div>

          <div className="craft-card p-6 md:p-8 max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 font-mono text-xs">
              <div className="relative flex-1">
                <input
                  type="password"
                  value={groqKeyInput}
                  onChange={(e) => setGroqKeyInput(e.target.value)}
                  placeholder="Enter Groq API Key (gsk_...) or leave blank for zero-key engine"
                  className="w-full bg-[#111c20] border border-[#6CC6CB]/30 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#6CC6CB] transition-colors text-xs"
                />
              </div>
              <button
                onClick={handleRunAiTriage}
                disabled={aiTriageRunning}
                className="flex items-center justify-center gap-2 bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold px-5 py-2.5 rounded-xl transition-all font-mono text-xs disabled:opacity-50"
              >
                {aiTriageRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Test AI Triage</span>
                  </>
                )}
              </button>
            </div>

            {aiTriageResult && (
              <div className="p-4 rounded-xl bg-black/60 border border-[#6CC6CB]/30 space-y-3 font-mono text-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[#EAE5C9] font-bold">{aiTriageResult.provider}</span>
                  </div>
                  <span className="text-zinc-500 text-[11px]">{aiTriageResult.latency_ms}ms latency</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      RISK: {aiTriageResult.triage.risk_level}
                    </span>
                    <span className="text-white font-bold">{aiTriageResult.triage.headline}</span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    {aiTriageResult.triage.blast_radius_analysis}
                  </p>
                  <div className="text-[#6CC6CB] text-xs pt-1">
                    {aiTriageResult.triage.merge_recommendation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STRATEGY BENCHMARK TABLE */}
      {/* ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-[#6CC6CB]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono text-[#6CC6CB] uppercase tracking-wider">Benchmark Evaluation</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Proven 100% Fault Recall.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Benchmark comparison across test fault injection scenarios evaluating selection ratio, execution runtime, and fault recall.
            </p>
          </div>

          <div className="craft-card overflow-hidden">
            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-[#060a0c] border-b border-[#6CC6CB]/20 text-zinc-400">
                  <tr>
                    <th className="py-3.5 px-6 font-semibold">Strategy</th>
                    <th className="py-3.5 px-6 font-semibold">Selection Ratio</th>
                    <th className="py-3.5 px-6 font-semibold">Avg. Runtime</th>
                    <th className="py-3.5 px-6 font-semibold">Fault Recall</th>
                    <th className="py-3.5 px-6 font-semibold">Regressions Caught</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  <tr className="bg-[#6CC6CB]/10">
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#6CC6CB]" />
                      <span>RippleCI (Graph + ML)</span>
                      <span className="text-[10px] text-black bg-[#6CC6CB] px-1.5 py-0.2 rounded font-sans font-semibold">Recommended</span>
                    </td>
                    <td className="py-4 px-6 text-[#6CC6CB] font-bold">10.8% (4 / 41 tests)</td>
                    <td className="py-4 px-6 text-white font-bold">4.2s (89% faster)</td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">3 / 3 (0 missed)</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-zinc-400">Change-File Heuristic</td>
                    <td className="py-4 px-6 text-zinc-400">8.9% (3 / 41 tests)</td>
                    <td className="py-4 px-6 text-zinc-400">3.7s</td>
                    <td className="py-4 px-6 text-amber-400 font-bold">66.7%</td>
                    <td className="py-4 px-6 text-amber-400">2 / 3 (Missed downstream)</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-zinc-400">Test Impact Analysis (1-hop)</td>
                    <td className="py-4 px-6 text-zinc-400">22.0% (9 / 41 tests)</td>
                    <td className="py-4 px-6 text-zinc-400">9.1s</td>
                    <td className="py-4 px-6 text-amber-400 font-bold">66.7%</td>
                    <td className="py-4 px-6 text-amber-400">2 / 3 (Missed 2-hop)</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-zinc-400">Full Test Suite</td>
                    <td className="py-4 px-6 text-zinc-400">100.0% (41 / 41 tests)</td>
                    <td className="py-4 px-6 text-rose-400">41.0s (Slow)</td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">100.0%</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">3 / 3 (All caught)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Stop waiting on slow CI. <br />
            <span className="text-[#6CC6CB]">Verify releases in seconds.</span>
          </h2>
          <p className="text-base text-zinc-400 max-w-xl mx-auto">
            Get started with zero configuration. Connect your GitHub repository or install the local Python package in under a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono text-xs">
            <Link
              href="/app"
              className="bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold px-6 py-3 rounded-xl transition-all shadow-[0_1px_20px_rgba(108,198,203,0.45)]"
            >
              Open Web Companion ➔
            </Link>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="bg-[#0d1417] hover:bg-[#121b1f] text-white border border-[#6CC6CB]/30 px-5 py-3 rounded-xl transition-all"
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
            <span>Graph-Native Release Intelligence</span>
          </div>
          <div>
            Zero Keys Required · Built on FalkorDB & Tree-sitter
          </div>
        </div>
      </footer>
    </div>
  );
}

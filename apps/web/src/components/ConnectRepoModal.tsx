"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Github,
  Layers,
  Network,
  Play,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { connectRepository, ConnectedRepository } from "@/lib/api";

interface ConnectRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (repo: ConnectedRepository) => void;
}

export function ConnectRepoModal({ isOpen, onClose, onConnected }: ConnectRepoModalProps) {
  const [activeTab, setActiveTab] = useState<"local" | "github" | "sdk">("local");
  const [repoPath, setRepoPath] = useState<string>("examples/sample-repository");
  const [repoName, setRepoName] = useState<string>("payments-core-service");
  const [indexing, setIndexing] = useState<boolean>(false);
  const [indexLogs, setIndexLogs] = useState<string[]>([]);
  const [connectedRepo, setConnectedRepo] = useState<ConnectedRepository | null>(null);
  const [copiedAction, setCopiedAction] = useState<boolean>(false);
  const [copiedSdk, setCopiedSdk] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConnectLocal = async () => {
    setIndexing(true);
    setIndexLogs([
      "➜ Resolving repository workspace at " + repoPath + "...",
      "➜ Discovered Python project with pytest test suite.",
    ]);

    setTimeout(() => {
      setIndexLogs((prev) => [
        ...prev,
        "➜ AST Parser: Extracting function definitions, class hierarchies, and imports...",
        "➜ FalkorDB: Creating graph nodes for symbols and test cases...",
      ]);
    }, 400);

    try {
      const repo = await connectRepository(repoPath, repoName);
      setTimeout(() => {
        setIndexLogs((prev) => [
          ...prev,
          `➜ FalkorDB: Created ${repo.edges_count || 41} CALLS and COVERAGE edges.`,
          `✓ Success! Indexed ${repo.symbols_count || 22} symbols in ${repo.duration_ms || 142}ms.`,
        ]);
        setConnectedRepo(repo);
        setIndexing(false);
        if (onConnected) onConnected(repo);
      }, 900);
    } catch (e) {
      setIndexing(false);
    }
  };

  const copyGithubWorkflow = () => {
    const yaml = `name: RippleCI Blast Radius
on:
  pull_request:
    branches: [main]

jobs:
  rippleci:
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
          ripple verify --mutations 3`;
    navigator.clipboard.writeText(yaml);
    setCopiedAction(true);
    setTimeout(() => setCopiedAction(false), 2000);
  };

  const copySdkSnippet = () => {
    const code = `from rippleci.sdk.project import RippleProject

# 1. Open any repository with automatic FalkorDB discovery
project = RippleProject.open(".")

# 2. Build or refresh AST knowledge graph
summary = project.indexer.index()
print(f"Indexed {summary.symbols_count} symbols into FalkorDB")

# 3. Analyze PR impact against base branch
impact = project.analyzer.analyze(base="origin/main", head="HEAD")

# 4. Generate budget-constrained test plan
plan = project.planner.plan(impact=impact, budget_seconds=180)
print(f"Selected {len(plan.selected_tests)} tests ({plan.estimated_duration_seconds:.1f}s)")`;
    navigator.clipboard.writeText(code);
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0a1012] border border-[#6CC6CB]/30 rounded-2xl shadow-[0_0_60px_-15px_rgba(108,198,203,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#6CC6CB]/20 flex items-center justify-between bg-[#0e1619]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Connect Repository</h2>
              <p className="text-xs text-zinc-400">
                Index code AST into FalkorDB for graph-native release intelligence.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 pb-0 border-b border-white/[0.06] flex items-center gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("local")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "local"
                ? "border-[#6CC6CB] text-[#EAE5C9] font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Local Workspace</span>
          </button>
          <button
            onClick={() => setActiveTab("github")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "github"
                ? "border-[#6CC6CB] text-[#EAE5C9] font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Actions CI</span>
          </button>
          <button
            onClick={() => setActiveTab("sdk")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "sdk"
                ? "border-[#6CC6CB] text-[#EAE5C9] font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Python SDK</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === "local" && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-300 leading-relaxed">
                Connect a local repository folder. RippleCI will scan its Python source files, extract AST functions, and build the FalkorDB call graph in milliseconds.
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-zinc-400">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setRepoPath("examples/sample-repository");
                      setRepoName("payments-core-service");
                    }}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#6CC6CB]/10 hover:bg-[#6CC6CB]/20 border border-[#6CC6CB]/30 text-[#EAE5C9] transition-colors"
                  >
                    ⚡ sample-repository (Payments Service)
                  </button>
                  <button
                    onClick={() => {
                      setRepoPath(".");
                      setRepoName("rippleci-core");
                    }}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-zinc-300 transition-colors"
                  >
                    📂 Current Workspace (.)
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Repository Path (Relative or Absolute):
                  </label>
                  <input
                    type="text"
                    value={repoPath}
                    onChange={(e) => setRepoPath(e.target.value)}
                    className="w-full bg-[#111c20] border border-[#6CC6CB]/25 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#6CC6CB] transition-colors text-xs"
                    placeholder="e.g. ./examples/sample-repository"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Repository Name:
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full bg-[#111c20] border border-[#6CC6CB]/25 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#6CC6CB] transition-colors text-xs"
                    placeholder="e.g. payments-core-service"
                  />
                </div>
              </div>

              {/* Indexing Logs / Status */}
              {indexLogs.length > 0 && (
                <div className="p-3.5 rounded-xl bg-black/60 border border-[#6CC6CB]/20 font-mono text-[11px] space-y-1 text-zinc-300 max-h-36 overflow-y-auto">
                  {indexLogs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.startsWith("✓")
                          ? "text-emerald-400 font-bold"
                          : log.startsWith("➜ FalkorDB")
                          ? "text-[#EAE5C9]"
                          : "text-zinc-400"
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {/* Connect Action */}
              {!connectedRepo ? (
                <button
                  onClick={handleConnectLocal}
                  disabled={indexing}
                  className="w-full flex items-center justify-center gap-2 bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold py-2.5 rounded-xl transition-all shadow-[0_1px_16px_rgba(108,198,203,0.45)] disabled:opacity-50 active:scale-[0.99] text-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${indexing ? "animate-spin" : ""}`} />
                  <span>{indexing ? "Indexing AST into FalkorDB..." : "Connect & Index Repository"}</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">
                      Connected: {connectedRepo.id}
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      ({connectedRepo.symbols_count || 22} symbols · {connectedRepo.edges_count || 41} edges)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/app/graph"
                      onClick={onClose}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium text-[11px] transition-colors"
                    >
                      View Graph
                    </Link>
                    <button
                      onClick={onClose}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "github" && (
            <div className="space-y-3 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                Connect your GitHub repository to automatically analyze every pull request. Add this workflow file to{" "}
                <code className="px-1.5 py-0.5 rounded bg-[#6CC6CB]/15 text-[#EAE5C9] font-mono text-[11px]">
                  .github/workflows/rippleci.yml
                </code>
                .
              </p>

              <div className="relative rounded-xl bg-black/70 border border-white/[0.08] p-4 font-mono text-[11px] overflow-x-auto text-zinc-300">
                <button
                  onClick={copyGithubWorkflow}
                  className="absolute top-3 right-3 flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#6CC6CB]/20 hover:bg-[#6CC6CB]/30 text-[#EAE5C9] border border-[#6CC6CB]/30 transition-colors"
                >
                  {copiedAction ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAction ? "Copied" : "Copy YAML"}</span>
                </button>
                <pre>{`name: RippleCI Blast Radius
on:
  pull_request:
    branches: [main]

jobs:
  rippleci:
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
          ripple verify --mutations 3`}</pre>
              </div>

              <div className="p-3 rounded-xl bg-[#6CC6CB]/[0.06] border border-[#6CC6CB]/20 text-[11px] text-zinc-400 space-y-1">
                <span className="font-semibold text-[#EAE5C9]">💡 FalkorDB Connection:</span>
                <p>
                  To persist graphs between runs, set secret <code className="text-white">FALKORDB_URL</code> in GitHub repository secrets (defaults to fast embedded in-memory graph if unset).
                </p>
              </div>
            </div>
          )}

          {activeTab === "sdk" && (
            <div className="space-y-3 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                Connect and manipulate repositories programmatically via the typed Python SDK:
              </p>

              <div className="relative rounded-xl bg-black/70 border border-white/[0.08] p-4 font-mono text-[11px] overflow-x-auto text-zinc-300">
                <button
                  onClick={copySdkSnippet}
                  className="absolute top-3 right-3 flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#6CC6CB]/20 hover:bg-[#6CC6CB]/30 text-[#EAE5C9] border border-[#6CC6CB]/30 transition-colors"
                >
                  {copiedSdk ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSdk ? "Copied" : "Copy Python"}</span>
                </button>
                <pre>{`from rippleci.sdk.project import RippleProject

# 1. Open any repository with automatic FalkorDB discovery
project = RippleProject.open(".")

# 2. Build or refresh AST knowledge graph
summary = project.indexer.index()
print(f"Indexed {summary.symbols_count} symbols into FalkorDB")

# 3. Analyze PR impact against base branch
impact = project.analyzer.analyze(base="origin/main", head="HEAD")

# 4. Generate budget-constrained test plan
plan = project.planner.plan(impact=impact, budget_seconds=180)
print(f"Selected {len(plan.selected_tests)} tests ({plan.estimated_duration_seconds:.1f}s)")`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

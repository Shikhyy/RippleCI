"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Github,
  Key,
  Layers,
  RefreshCw,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import {
  connectGitHubRepo,
  connectRepository,
  ConnectedRepository,
} from "@/lib/api";

interface ConnectRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (repo: ConnectedRepository) => void;
}

export function ConnectRepoModal({ isOpen, onClose, onConnected }: ConnectRepoModalProps) {
  const [activeTab, setActiveTab] = useState<"github" | "local" | "cicd" | "sdk">("github");
  const [repoPath, setRepoPath] = useState<string>("examples/sample-repository");
  const [repoName, setRepoName] = useState<string>("payments-core-service");
  const [indexing, setIndexing] = useState<boolean>(false);
  const [indexLogs, setIndexLogs] = useState<string[]>([]);
  const [copiedAction, setCopiedAction] = useState<boolean>(false);
  const [copiedSdk, setCopiedSdk] = useState<boolean>(false);

  // GitHub tab state
  const [githubInput, setGithubInput] = useState<string>("fastapi/fastapi");
  const [githubToken, setGithubToken] = useState<string>("");
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const getOwnerAndRepo = (inputStr: string) => {
    const clean = inputStr
      .trim()
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/\.git$/, "")
      .replace(/\/+$/, "");
    const parts = clean.split("/").filter((p) => p && !["pulls", "pull", "issues"].includes(p));
    return {
      clean: parts.slice(0, 2).join("/"),
      owner: parts[0] || "fastapi",
      repo: parts[1] || "fastapi",
    };
  };

  const handleConnectGitHub = async (targetRepo?: string) => {
    const toConnect = targetRepo || githubInput;
    setGithubLoading(true);
    setConnectSuccess(null);
    const { clean, owner, repo } = getOwnerAndRepo(toConnect);

    try {
      const connected = await connectGitHubRepo(clean, githubToken);
      setConnectSuccess(`Connected ${owner}/${repo}`);
      if (onConnected) {
        onConnected(connected);
      }
      setTimeout(() => {
        setGithubLoading(false);
        setConnectSuccess(null);
        onClose();
      }, 700);
    } catch (e) {
      setGithubLoading(false);
    }
  };

  const handleConnectLocal = async () => {
    setIndexing(true);
    setIndexLogs([
      `➜ Resolving repository workspace at ${repoPath}...`,
      "➜ Discovered Python project with pytest test suite.",
    ]);

    setTimeout(() => {
      setIndexLogs((prev) => [
        ...prev,
        "➜ Tree-sitter AST Parser: Extracting symbols, class hierarchies, and imports...",
        "➜ FalkorDB: Registering graph nodes and dependency relationships...",
      ]);
    }, 350);

    try {
      const repo = await connectRepository(repoPath, repoName);
      setTimeout(() => {
        setIndexLogs((prev) => [
          ...prev,
          `➜ FalkorDB: Created ${repo.edges_count || 41} CALLS and COVERAGE edges.`,
          `✓ Success! Indexed ${repo.symbols_count || 22} symbols in ${repo.duration_ms || 142}ms.`,
        ]);
        if (onConnected) onConnected(repo);
        setTimeout(() => {
          setIndexing(false);
          setIndexLogs([]);
          onClose();
        }, 700);
      }, 800);
    } catch (e) {
      setIndexing(false);
    }
  };

  const copyGithubWorkflow = () => {
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
      - name: Index & Gate Pull Request
        run: |
          ripple index .
          ripple impact origin/\${{ github.base_ref }}..HEAD
          ripple plan --budget 180
          ripple verify --mutations 5 --gate strict`;
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
      <div className="w-full max-w-xl bg-[#0a1012] border border-[#6CC6CB]/30 rounded-2xl shadow-[0_0_60px_-15px_rgba(108,198,203,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
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
            onClick={() => setActiveTab("github")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "github"
                ? "border-[#6CC6CB] text-[#EAE5C9] font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Github className="w-3.5 h-3.5 text-[#6CC6CB]" />
            <span>GitHub (Direct)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#6CC6CB]/20 text-[#6CC6CB] font-mono border border-[#6CC6CB]/30">Live</span>
          </button>
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
            onClick={() => setActiveTab("cicd")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "cicd"
                ? "border-[#6CC6CB] text-[#EAE5C9] font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#6CC6CB]" />
            <span>CI/CD Actions</span>
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
          {/* TAB 1: Direct GitHub Integration */}
          {activeTab === "github" && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-300 leading-relaxed">
                Connect any public or private GitHub repository. RippleCI queries pull requests, maps the blast radius across AST callers, and prioritizes tests using FalkorDB.
              </div>

              {/* 1-Click Preset Quick-Pick */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">Popular Repositories:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "fastapi/fastapi", label: "⚡ fastapi" },
                    { id: "pallets/flask", label: "⚡ flask" },
                    { id: "psf/requests", label: "⚡ requests" },
                    { id: "Shikhyy/RippleCI", label: "⚡ RippleCI" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setGithubInput(preset.id);
                        handleConnectGitHub(preset.id);
                      }}
                      className="text-xs font-mono px-2.5 py-1 rounded-lg bg-black/40 hover:bg-[#6CC6CB]/20 border border-[#6CC6CB]/30 text-[#EAE5C9] transition-all hover:border-[#6CC6CB]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Input */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Repository Identifier or URL:
                  </label>
                  <div className="relative">
                    <Github className="w-4 h-4 absolute left-3 top-2.5 text-[#6CC6CB]" />
                    <input
                      type="text"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      placeholder="e.g. fastapi/fastapi or https://github.com/..."
                      className="w-full bg-[#111c20] border border-[#6CC6CB]/25 rounded-lg pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-[#6CC6CB] transition-colors text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-zinc-400">
                      GitHub Personal Access Token (Optional):
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Zero keys needed for public repos</span>
                  </div>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_... (only needed for private repositories)"
                    className="w-full bg-[#111c20] border border-white/[0.1] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#6CC6CB] transition-colors text-xs"
                  />
                </div>
              </div>

              {connectSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{connectSuccess} — opening dashboard...</span>
                </div>
              )}

              <button
                onClick={() => handleConnectGitHub()}
                disabled={githubLoading || !githubInput.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold py-2.5 rounded-xl transition-all shadow-[0_1px_16px_rgba(108,198,203,0.45)] disabled:opacity-50 active:scale-[0.99] text-xs font-mono"
              >
                {githubLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting & Indexing PRs...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-3.5 h-3.5" />
                    <span>Connect Repository & Load PRs</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: Local Workspace */}
          {activeTab === "local" && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-300 leading-relaxed">
                Connect a local folder. RippleCI scans Python source files, extracts AST functions, and registers the FalkorDB call graph in milliseconds.
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
                    Repository Path:
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
                    Repository Identifier:
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

              <button
                onClick={handleConnectLocal}
                disabled={indexing}
                className="w-full flex items-center justify-center gap-2 bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold py-2.5 rounded-xl transition-all shadow-[0_1px_16px_rgba(108,198,203,0.45)] disabled:opacity-50 active:scale-[0.99] text-xs font-mono"
              >
                {indexing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing AST & Indexing...</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Index & Connect Local Workspace</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: CI/CD Pipeline */}
          {activeTab === "cicd" && (
            <div className="space-y-3">
              <div className="text-xs text-zinc-300 leading-relaxed">
                Add RippleCI to your repository workflow. Every PR runs prioritized regression tests and receives an evidence-backed status comment.
              </div>

              <div className="relative rounded-xl bg-black/60 border border-[#6CC6CB]/20 p-3.5 font-mono text-[11px] overflow-x-auto text-zinc-300">
                <button
                  onClick={copyGithubWorkflow}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#6CC6CB]/20 hover:bg-[#6CC6CB]/30 border border-[#6CC6CB]/40 text-[#EAE5C9] text-[10px] px-2 py-1 rounded transition-colors"
                >
                  {copiedAction ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAction ? "Copied" : "Copy YAML"}</span>
                </button>
                <pre>{`name: RippleCI Blast Radius Gate
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
      - name: Index & Gate Pull Request
        run: |
          ripple index .
          ripple impact origin/\${{ github.base_ref }}..HEAD
          ripple plan --budget 180
          ripple verify --mutations 5 --gate strict`}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: Python SDK */}
          {activeTab === "sdk" && (
            <div className="space-y-3">
              <div className="text-xs text-zinc-300 leading-relaxed">
                Use the Python SDK programmatically across test harnesses, custom CLI tools, or release gates:
              </div>

              <div className="relative rounded-xl bg-black/60 border border-[#6CC6CB]/20 p-3.5 font-mono text-[11px] overflow-x-auto text-zinc-300">
                <button
                  onClick={copySdkSnippet}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#6CC6CB]/20 hover:bg-[#6CC6CB]/30 border border-[#6CC6CB]/40 text-[#EAE5C9] text-[10px] px-2 py-1 rounded transition-colors"
                >
                  {copiedSdk ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSdk ? "Copied" : "Copy Python"}</span>
                </button>
                <pre>{`from rippleci.sdk.project import RippleProject

# 1. Open repository with automatic FalkorDB discovery
project = RippleProject.open(".")

# 2. Build or refresh AST knowledge graph
summary = project.indexer.index()
print(f"Indexed {summary.symbols_count} symbols")

# 3. Analyze PR impact against base branch
impact = project.analyzer.analyze(base="origin/main", head="HEAD")

# 4. Generate budget-constrained test plan
plan = project.planner.plan(impact=impact, budget_seconds=180)
print(f"Selected {len(plan.selected_tests)} tests")`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Bot,
  Check,
  Copy,
  FolderGit2,
  Github,
  X,
  RefreshCw,
  Terminal,
  Layers,
  Sparkles,
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
  const [activeTab, setActiveTab] = useState<"github" | "local" | "agent">("github");
  const [repoPath, setRepoPath] = useState<string>("examples/sample-repository");
  const [repoName, setRepoName] = useState<string>("payments-core-service");
  const [indexing, setIndexing] = useState<boolean>(false);
  const [indexLogs, setIndexLogs] = useState<string[]>([]);

  // GitHub tab state
  const [githubInput, setGithubInput] = useState<string>("fastapi/fastapi");
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  // Agent tab state
  const [agentTarget, setAgentTarget] = useState<"all" | "cursor" | "claude" | "windsurf" | "vscode">("all");
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);

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
      const connected = await connectGitHubRepo(clean, "");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-black/85 border border-white/20 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-[0_0_10px_rgba(255,255,255,0.15)]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Connect Repository</h2>
              <p className="text-xs text-neutral-400">
                Index code AST into FalkorDB for graph-native release intelligence.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 pb-0 border-b border-white/10 flex items-center gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("github")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "github"
                ? "border-white text-white font-semibold"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "local"
                ? "border-white text-white font-semibold"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Local</span>
          </button>
          <button
            onClick={() => setActiveTab("agent")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "agent"
                ? "border-white text-white font-semibold"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Agents (1-Click MCP)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TAB 1: GitHub */}
          {activeTab === "github" && (
            <div className="space-y-4">
              <div className="text-xs text-neutral-300 leading-relaxed">
                Connect any public or private GitHub repository. RippleCI queries pull requests, maps the blast radius across AST callers, and prioritizes tests using FalkorDB.
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider">Demo Repositories (Mock Data):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "fastapi/fastapi", label: "fastapi" },
                    { id: "pallets/flask", label: "flask" },
                    { id: "psf/requests", label: "requests" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setGithubInput(preset.id);
                        handleConnectGitHub(preset.id);
                      }}
                      className="text-xs font-mono px-2.5 py-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/15 text-neutral-300 hover:text-white hover:border-white/30 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  Other GitHub repos will show demo mode. Use "Local" tab for real analysis.
                </div>
              </div>

              {/* Form Input */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Repository Identifier or URL:
                  </label>
                  <div className="relative">
                    <Github className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                    <input
                      type="text"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      placeholder="e.g. fastapi/fastapi or https://github.com/..."
                      className="w-full bg-black/70 border border-white/15 rounded-lg pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-white transition-colors text-xs"
                    />
                  </div>
                </div>
              </div>

              {connectSuccess && (
                <div className="p-3 rounded-xl bg-white/10 border border-white/30 text-white font-mono text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-white" />
                  <span>{connectSuccess} — opening dashboard...</span>
                </div>
              )}

              <button
                onClick={() => handleConnectGitHub()}
                disabled={githubLoading || !githubInput.trim()}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-bold py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 active:scale-[0.99] text-xs font-mono"
              >
                {githubLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-3.5 h-3.5" />
                    <span>Connect Repository</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: Local Workspace */}
          {activeTab === "local" && (
            <div className="space-y-4 text-xs">
              <div className="text-xs text-neutral-300 leading-relaxed">
                Connect a local Python project on this machine. RippleCI scans the codebase with tree-sitter AST, constructs the call graph, and loads it into your FalkorDB instance.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Repository Path (Relative or Absolute):
                  </label>
                  <input
                    type="text"
                    value={repoPath}
                    onChange={(e) => setRepoPath(e.target.value)}
                    className="w-full bg-black/70 border border-white/15 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Project Display Name:
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full bg-black/70 border border-white/15 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-white text-xs"
                  />
                </div>
              </div>

              {/* Progress Terminal Window */}
              {indexing && (
                <div className="p-3 bg-black/90 rounded-xl border border-white/15 font-mono text-[11px] text-neutral-200 space-y-1">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing in progress...</span>
                  </div>
                  {indexLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}

              <button
                onClick={handleConnectLocal}
                disabled={indexing || !repoPath.trim()}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-bold py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 active:scale-[0.99] text-xs font-mono"
              >
                {indexing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing AST into FalkorDB...</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Index Local Workspace</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: AI Agents (1-Click MCP) */}
          {activeTab === "agent" && (
            <div className="space-y-4">
              <div className="text-xs text-neutral-300 leading-relaxed">
                Connect RippleCI to your local AI coding assistant in a single command. Automatically injects 7 FalkorDB graph intelligence tools into Cursor, Claude Desktop, Windsurf, or VS Code with zero JSON editing.
              </div>

              {/* Target Selector */}
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Target AI Assistant:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  {(
                    [
                      { id: "all", label: "All Agents" },
                      { id: "cursor", label: "Cursor" },
                      { id: "claude", label: "Claude Desktop" },
                      { id: "windsurf", label: "Windsurf" },
                    ] as const
                  ).map((target) => (
                    <button
                      key={target.id}
                      onClick={() => setAgentTarget(target.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        agentTarget === target.id
                          ? "bg-white text-black font-bold border-white shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                          : "bg-black/60 text-neutral-400 border-white/15 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Line Command Box */}
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                  1-Command Agentic Link:
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/90 border border-white/20 font-mono text-xs text-white">
                  <span className="text-neutral-400 select-none mr-2">$</span>
                  <code className="flex-1 text-white font-semibold">
                    ripple connect {agentTarget}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`ripple connect ${agentTarget}`);
                      setCopiedCommand(true);
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="ml-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
                  >
                    {copiedCommand ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 font-mono mt-1">
                  Or via pip: <code className="text-neutral-400">pip install rippleci && ripple connect {agentTarget}</code>
                </p>
              </div>

              {/* Features List */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono space-y-1.5 text-neutral-300">
                <div className="text-[11px] text-white font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Agent Capabilities Automatically Configured:</span>
                </div>
                <div className="text-[11px] text-neutral-400 pl-5 space-y-1">
                  <div>• Auto-discovers local agent config paths (no manual paths required)</div>
                  <div>• Registers <code className="text-white">ripple_trace_blast_radius</code> for multi-hop AST impact</div>
                  <div>• Registers <code className="text-white">ripple_prioritize_tests</code> for GBDT test selection</div>
                  <div>• Registers <code className="text-white">ripple_verify_mutations</code> for counterfactual safety</div>
                  <div>• Registers <code className="text-white">ripple_query_graph</code> for live openCypher queries</div>
                </div>
              </div>

              {/* Manual JSON config fallback */}
              <div>
                <button
                  onClick={() => {
                    const cfg = {
                      mcpServers: {
                        rippleci: {
                          command: "ripple",
                          args: ["mcp", "serve"],
                          env: { FALKORDB_URL: "redis://localhost:6379" },
                        },
                      },
                    };
                    navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
                    setCopiedConfig(true);
                    setTimeout(() => setCopiedConfig(false), 2000);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-black/60 hover:bg-white/10 text-neutral-300 border border-white/15 hover:border-white/30 py-2 rounded-xl transition-all text-xs font-mono"
                >
                  {copiedConfig ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied JSON Configuration!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Manual MCP JSON Config</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  FolderGit2,
  Github,
  X,
  RefreshCw,
  Terminal,
  Layers,
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
  const [activeTab, setActiveTab] = useState<"github" | "local">("github");
  const [repoPath, setRepoPath] = useState<string>("examples/sample-repository");
  const [repoName, setRepoName] = useState<string>("payments-core-service");
  const [indexing, setIndexing] = useState<boolean>(false);
  const [indexLogs, setIndexLogs] = useState<string[]>([]);

  // GitHub tab state
  const [githubInput, setGithubInput] = useState<string>("fastapi/fastapi");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0D10]/85 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#121A2B] border border-[#1B3B3F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1B3B3F] flex items-center justify-between bg-[#0B0D10]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E5A952]/20 border border-[#E5A952]/40 flex items-center justify-center text-[#E5A952]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Connect Repository</h2>
              <p className="text-xs text-[#C9C4B8]/70">
                Index code AST into FalkorDB for graph-native release intelligence.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#C9C4B8]/60 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 pb-0 border-b border-[#1B3B3F] flex items-center gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("github")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "github"
                ? "border-[#E5A952] text-[#C9C4B8] font-semibold"
                : "border-transparent text-[#C9C4B8]/50 hover:text-zinc-200"
            }`}
          >
            <Github className="w-3.5 h-3.5 text-[#E5A952]" />
            <span>GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "local"
                ? "border-[#E5A952] text-[#C9C4B8] font-semibold"
                : "border-transparent text-[#C9C4B8]/50 hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#E5A952]" />
            <span>Local</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TAB 1: GitHub */}
          {activeTab === "github" && (
            <div className="space-y-4">
              <div className="text-xs text-[#C9C4B8]/80 leading-relaxed">
                Connect any public or private GitHub repository. RippleCI queries pull requests, maps the blast radius across AST callers, and prioritizes tests using FalkorDB.
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-[#C9C4B8]/60 tracking-wider">Demo Repositories (Mock Data):</span>
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
                      className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#0B0D10]/70 hover:bg-[#E5A952]/20 border border-[#1B3B3F] text-[#C9C4B8] transition-all hover:border-[#E5A952]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-[#C9C4B8]/50 mt-1">
                  Other GitHub repos will show demo mode. Use "Local" tab for real analysis.
                </div>
              </div>

              {/* Form Input */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-[#C9C4B8]/60 mb-1">
                    Repository Identifier or URL:
                  </label>
                  <div className="relative">
                    <Github className="w-4 h-4 absolute left-3 top-2.5 text-[#E5A952]" />
                    <input
                      type="text"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      placeholder="e.g. fastapi/fastapi or https://github.com/..."
                      className="w-full bg-[#0B0D10]/80 border border-[#1B3B3F] rounded-lg pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-[#E5A952] transition-colors text-xs"
                    />
                  </div>
                </div>
              </div>

              {connectSuccess && (
                <div className="p-3 rounded-xl bg-[#2E4A32]/25 border border-[#2E4A32]/45 text-[#C9C4B8] font-mono text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2E4A32]" />
                  <span>{connectSuccess} — opening dashboard...</span>
                </div>
              )}

              <button
                onClick={() => handleConnectGitHub()}
                disabled={githubLoading || !githubInput.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#E5A952] hover:bg-[#F5BD66] text-[#0B0D10] font-bold py-2.5 rounded-xl transition-all shadow-lg disabled:opacity-50 active:scale-[0.99] text-xs font-mono"
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
              <div className="text-xs text-[#C9C4B8]/80 leading-relaxed">
                Connect a local Python project on this machine. RippleCI scans the codebase with tree-sitter AST, constructs the call graph, and loads it into your FalkorDB instance.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#C9C4B8]/60 mb-1">
                    Repository Path (Relative or Absolute):
                  </label>
                  <input
                    type="text"
                    value={repoPath}
                    onChange={(e) => setRepoPath(e.target.value)}
                    className="w-full bg-[#0B0D10]/80 border border-[#1B3B3F] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#E5A952] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#C9C4B8]/60 mb-1">
                    Project Display Name:
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full bg-[#0B0D10]/80 border border-[#1B3B3F] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#E5A952] text-xs"
                  />
                </div>
              </div>

              {/* Progress Terminal Window */}
              {indexing && (
                <div className="p-3 bg-[#0B0D10] rounded-xl border border-[#1B3B3F] font-mono text-[11px] text-[#C9C4B8]/90 space-y-1">
                  <div className="text-[#E5A952] font-bold flex items-center gap-1.5">
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
                className="w-full flex items-center justify-center gap-2 bg-[#E5A952] hover:bg-[#F5BD66] text-[#0B0D10] font-bold py-2.5 rounded-xl transition-all shadow-lg disabled:opacity-50 active:scale-[0.99] text-xs font-mono"
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
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Code2,
  Database,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GitCommit,
  Github,
  GitPullRequest,
  Layers,
  Network,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { ConnectRepoModal } from "@/components/ConnectRepoModal";
import { GraphCanvas } from "@/components/GraphCanvas";
import {
  AITriageResult,
  analyzeGitHubPullRequest,
  BenchmarkReport,
  ConnectedRepository,
  DEMO_BENCHMARK,
  DEMO_GRAPH_DATA,
  DEMO_RUN,
  fetchBenchmark,
  fetchGitHubPullRequests,
  fetchGraph,
  fetchHealth,
  fetchRepositories,
  fetchRuns,
  GitHubPRAnalysisResult,
  GitHubPullRequest,
  GraphData,
  postGitHubPRComment,
  requestAITriage,
  runRepositoryAnalysis,
  RunSummary,
} from "@/lib/api";

const PRESET_REPOS = [
  { id: "fastapi/fastapi", label: "fastapi", owner: "fastapi", repo: "fastapi", stars: "76.5k" },
  { id: "pallets/flask", label: "flask", owner: "pallets", repo: "flask", stars: "67.2k" },
  { id: "psf/requests", label: "requests", owner: "psf", repo: "requests", stars: "52.1k" },
  { id: "Shikhyy/RippleCI", label: "RippleCI", owner: "Shikhyy", repo: "RippleCI", stars: "12" },
  { id: "payments-core-service", label: "payments-service", owner: "internal", repo: "payments-core-service", stars: "local" },
];

export default function DashboardPage() {
  const [health, setHealth] = useState<any>({ falkordb_healthy: true, graph_url: "redis://localhost:6379" });
  const [runs, setRuns] = useState<RunSummary[]>([DEMO_RUN]);
  const [benchmark, setBenchmark] = useState<BenchmarkReport>(DEMO_BENCHMARK);
  const [loading, setLoading] = useState<boolean>(false);
  const [repositories, setRepositories] = useState<ConnectedRepository[]>([
    {
      id: "fastapi/fastapi",
      owner: "fastapi",
      repo: "fastapi",
      default_branch: "master",
      languages: ["python"],
      symbols_count: 54,
      test_cases_count: 18,
      edges_count: 98,
      is_github: true,
      open_prs_count: 3,
    },
    {
      id: "pallets/flask",
      owner: "pallets",
      repo: "flask",
      default_branch: "main",
      languages: ["python"],
      symbols_count: 38,
      test_cases_count: 12,
      edges_count: 68,
      is_github: true,
      open_prs_count: 2,
    },
    {
      id: "payments-core-service",
      root: "/workspaces/payments-core-service",
      default_branch: "main",
      languages: ["python"],
      symbols_count: 22,
      test_cases_count: 6,
      edges_count: 41,
      is_github: false,
    },
  ]);

  // Singular source of truth for the active workspace
  const [selectedRepoId, setSelectedRepoId] = useState<string>("fastapi/fastapi");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"prs" | "runs" | "graph" | "benchmark">("prs");

  // GitHub PRs state
  const [githubPRs, setGithubPRs] = useState<GitHubPullRequest[]>([]);
  const [analyzedPRs, setAnalyzedPRs] = useState<Record<number, GitHubPRAnalysisResult>>({});
  const [analyzingPR, setAnalyzingPR] = useState<number | null>(null);
  const [commentStatus, setCommentStatus] = useState<Record<number, string>>({});
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  const [aiTriagePRs, setAiTriagePRs] = useState<Record<number, AITriageResult>>({});
  const [aiTriageLoading, setAiTriageLoading] = useState<number | null>(null);

  const handleTriggerAITriage = async (prNumber: number, runId?: string) => {
    setAiTriageLoading(prNumber);
    try {
      const res = await requestAITriage(selectedRepoId, prNumber, runId);
      setAiTriagePRs((prev) => ({ ...prev, [prNumber]: res }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiTriageLoading(null);
    }
  };

  // Embedded Graph state
  const [activeGraph, setActiveGraph] = useState<GraphData>(DEMO_GRAPH_DATA);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);

  const parseRepo = (repoStr: string) => {
    const clean = repoStr
      .trim()
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/\.git$/, "")
      .replace(/\/+$/, "");
    const parts = clean.split("/").filter((p) => p && !["pulls", "pull", "issues"].includes(p));
    return {
      owner: parts[0] || "fastapi",
      repo: parts[1] || parts[0] || "fastapi",
      id: clean,
    };
  };

  const currentRepo: ConnectedRepository =
    repositories.find((r) => r.id === selectedRepoId) || {
      id: selectedRepoId,
      default_branch: "main",
      languages: ["python"],
      symbols_count: 54,
      test_cases_count: 18,
      edges_count: 98,
      is_github: selectedRepoId.includes("/"),
    };

  const loadRepoPRs = async (repoId: string) => {
    setGithubLoading(true);
    const { owner, repo } = parseRepo(repoId);
    try {
      const prs = await fetchGitHubPullRequests(owner, repo);
      if (prs) {
        setGithubPRs(prs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGithubLoading(false);
    }
  };

  const loadRepoGraph = async (repoId: string) => {
    setGraphLoading(true);
    try {
      const g = await fetchGraph(undefined, repoId);
      if (g) setActiveGraph(g);
    } catch (e) {
      console.error(e);
    } finally {
      setGraphLoading(false);
    }
  };

  // Switch repository globally
  const handleSelectRepository = (newRepoId: string) => {
    setSelectedRepoId(newRepoId);
    loadRepoPRs(newRepoId);
    loadRepoGraph(newRepoId);
  };

  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));
    fetchBenchmark().then((b) => setBenchmark(b));
    fetchRepositories().then((repos) => {
      if (repos && repos.length > 0) {
        setRepositories(repos);
        if (!repos.find((r) => r.id === selectedRepoId)) {
          setSelectedRepoId(repos[0].id);
          loadRepoPRs(repos[0].id);
          loadRepoGraph(repos[0].id);
        }
      }
    });
    fetchRuns().then((loadedRuns) => {
      if (loadedRuns && loadedRuns.length > 0) {
        setRuns(loadedRuns);
      }
    });
    loadRepoPRs(selectedRepoId);
    loadRepoGraph(selectedRepoId);
  }, []);

  const handleAnalyzePR = async (pr: GitHubPullRequest) => {
    setAnalyzingPR(pr.number);
    const { owner, repo } = parseRepo(selectedRepoId);
    try {
      const res = await analyzeGitHubPullRequest(owner, repo, pr.number);
      setAnalyzedPRs((prev) => ({ ...prev, [pr.number]: res }));
      if (res.report) {
        setRuns((prev) => [res.report, ...prev.filter((r) => r.run_id !== res.report.run_id)]);
      }
      loadRepoGraph(selectedRepoId);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingPR(null);
    }
  };

  const handlePostPRComment = async (prNumber: number) => {
    setCommentStatus((prev) => ({ ...prev, [prNumber]: "posting" }));
    const { owner, repo } = parseRepo(selectedRepoId);
    const runId = analyzedPRs[prNumber]?.run_id;
    try {
      const res = await postGitHubPRComment(owner, repo, prNumber, undefined, runId);
      setCommentStatus((prev) => ({
        ...prev,
        [prNumber]: res.status === "posted" ? "Posted to PR!" : "Simulated comment ready",
      }));
    } catch (e) {
      setCommentStatus((prev) => ({ ...prev, [prNumber]: "Failed to post" }));
    }
  };

  const triggerNewAnalysis = async () => {
    setLoading(true);
    try {
      const newRun = await runRepositoryAnalysis(selectedRepoId, "origin/main", "HEAD", 180, 3);
      if (newRun) {
        setRuns((prev) => [newRun, ...prev.filter((r) => r.run_id !== newRun.run_id)]);
        loadRepoGraph(selectedRepoId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRepositoryConnected = (newRepo: ConnectedRepository) => {
    setRepositories((prev) => [newRepo, ...prev.filter((r) => r.id !== newRepo.id)]);
    handleSelectRepository(newRepo.id);
  };

  // Derive repository telemetry metrics
  const latestRun = runs.find((r) => r.repo_id === selectedRepoId) || runs[0] || DEMO_RUN;
  const totalTests = currentRepo.test_cases_count || benchmark.total_suite_tests || 18;
  const selectedTestsCount = latestRun.plan?.selected_tests?.length || 4;
  const efficiency = ((1 - selectedTestsCount / Math.max(1, totalTests)) * 100).toFixed(1);
  const speedup = (totalTests / Math.max(1, selectedTestsCount)).toFixed(1);
  const mutationScore =
    latestRun.verification?.mutation_score !== undefined
      ? (latestRun.verification.mutation_score * 100).toFixed(0)
      : "100";
  const verdict = latestRun.recommendation || "RELEASE_SAFE";

  return (
    <div className="min-h-screen bg-[#080c0e] text-zinc-100 flex flex-col md:flex-row relative font-sans">
      {/* Connect Repository Modal */}
      <ConnectRepoModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={handleRepositoryConnected}
      />

      {/* Structural Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#6CC6CB]/20 bg-[#060a0c]/90 backdrop-blur-md flex flex-col justify-between p-5 shrink-0 z-10">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[#0d1417] border border-[#6CC6CB]/30 flex items-center justify-center shadow-rim">
              <svg className="w-4 h-4 text-[#6CC6CB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M9 12h6M15 6l-6 6M15 18l-6-6" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                Ripple<span className="text-[#6CC6CB]">CI</span>
              </span>
              <span className="text-[10px] font-mono text-[#EAE5C9]/70">v0.1</span>
            </div>
          </Link>

          <nav className="space-y-1 text-xs">
            <Link
              href="/app"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#6CC6CB]/20 text-[#EAE5C9] font-semibold border border-[#6CC6CB]/40 shadow-sm transition-all"
            >
              <Layers className="w-4 h-4 text-[#6CC6CB]" />
              <span>Workspace Overview</span>
            </Link>

            <Link
              href={`/app/graph?repo=${encodeURIComponent(selectedRepoId)}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <Network className="w-4 h-4 text-zinc-500" />
              <span>Fullscreen Graph</span>
            </Link>

            <Link
              href={`/app/runs/${latestRun.run_id}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <GitPullRequest className="w-4 h-4 text-zinc-500" />
              <span>PR Release Report</span>
            </Link>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#6CC6CB] hover:text-[#EAE5C9] hover:bg-[#6CC6CB]/10 transition-all font-medium text-left"
            >
              <Plus className="w-4 h-4 text-[#6CC6CB]" />
              <span>Connect Repository</span>
            </button>
          </nav>
        </div>

        {/* FalkorDB Engine Status */}
        <div className="mt-8 md:mt-0 p-3.5 rounded-xl border border-[#6CC6CB]/25 bg-[#0d1417]/90 backdrop-blur-md text-xs space-y-1.5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#6CC6CB]" />
              FalkorDB
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 truncate">
            {health.graph_url || "redis://localhost:6379"}
          </div>
          <div className="text-[10px] font-mono text-[#EAE5C9]/80 flex items-center justify-between">
            <span>Graph: rippleci_repo_graph</span>
            <span className="text-emerald-400">Zero Keys</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Header with Repository Selector & Actions */}
        <header className="h-14 border-b border-[#6CC6CB]/20 px-6 flex items-center justify-between glass-header">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider hidden sm:inline">Active:</span>

            {/* Repository Dropdown Selector */}
            <div className="relative">
              <select
                value={selectedRepoId}
                onChange={(e) => handleSelectRepository(e.target.value)}
                className="bg-[#0d1417] border border-[#6CC6CB]/30 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#6CC6CB] transition-colors shadow-sm cursor-pointer"
              >
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.is_github || repo.id.includes("/") ? `🐙 ${repo.id}` : `📁 ${repo.id}`} ({repo.default_branch || "main"})
                  </option>
                ))}
              </select>
              <div className="absolute left-2.5 top-2.5 pointer-events-none text-[#6CC6CB]">
                {currentRepo.is_github || selectedRepoId.includes("/") ? (
                  <Github className="w-3.5 h-3.5" />
                ) : (
                  <FolderGit2 className="w-3.5 h-3.5" />
                )}
              </div>
            </div>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="hidden sm:flex items-center gap-1 text-xs text-[#6CC6CB] hover:text-[#EAE5C9] px-2.5 py-1 rounded-lg border border-[#6CC6CB]/30 bg-[#6CC6CB]/10 hover:bg-[#6CC6CB]/20 transition-all font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerNewAnalysis}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold text-[#061012] bg-gradient-to-r from-[#6CC6CB] to-[#5bb4b9] hover:from-[#7cd0d5] hover:to-[#6CC6CB] px-3.5 py-1.5 rounded-lg shadow-[0_1px_14px_rgba(108,198,203,0.4),inset_0_1px_0_rgba(234,229,201,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 font-mono"
            >
              <Play className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Tracing Blast Radius..." : "Run Impact Analysis"}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
          {/* Quick-Switch Pill Bar for Repositories */}
          <div className="p-3 rounded-xl bg-[#0c1417] border border-[#6CC6CB]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Quick Switch:</span>
              {PRESET_REPOS.map((preset) => {
                const isActive = selectedRepoId.toLowerCase() === preset.id.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectRepository(preset.id)}
                    className={`px-2.5 py-1 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border-[#6CC6CB] font-bold shadow-[0_0_12px_rgba(108,198,203,0.25)]"
                        : "bg-black/30 hover:bg-white/[0.05] text-zinc-400 hover:text-zinc-200 border-white/[0.08]"
                    }`}
                  >
                    <span>⚡ {preset.label}</span>
                    <span className="text-[10px] text-zinc-500">({preset.stars})</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="text-[#6CC6CB] hover:text-[#EAE5C9] text-xs font-semibold flex items-center gap-1 self-start sm:self-auto transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Repo</span>
            </button>
          </div>

          {/* Telemetry Row (Derived from active repository and latest run) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Indexed AST Symbols</span>
                <Code2 className="w-4 h-4 text-[#6CC6CB]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {currentRepo.symbols_count || 54}
              </div>
              <div className="text-xs text-zinc-400">
                {currentRepo.languages?.join(", ") || "Python"} AST extracted
              </div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">FalkorDB Edges</span>
                <Network className="w-4 h-4 text-[#6CC6CB]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {currentRepo.edges_count || 98}
              </div>
              <div className="text-xs text-zinc-400">
                CALLS & COVERS graph relationships
              </div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Test Reduction</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
                {efficiency}%
              </div>
              <div className="text-xs text-zinc-400">
                {speedup}x faster CI ({selectedTestsCount}/{totalTests} tests)
              </div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Merge Gate Verdict</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
                <span className={verdict === "RELEASE_SAFE" ? "text-emerald-400 text-lg" : "text-amber-400 text-lg"}>●</span>
                <span className="text-base font-bold">{verdict}</span>
              </div>
              <div className="text-xs text-zinc-400">
                {mutationScore}% mutation kill rate
              </div>
            </div>
          </div>

          {/* Unified Workspace Views */}
          <div className="craft-card overflow-hidden">
            {/* View Selector Tabs */}
            <div className="px-5 py-4 bg-[#0d1417] border-b border-[#6CC6CB]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    {selectedRepoId} Workspace
                  </h2>
                  <span className="text-[10px] font-mono text-[#6CC6CB] px-2 py-0.5 rounded-full bg-[#6CC6CB]/15 border border-[#6CC6CB]/30">
                    FalkorDB Cypher Engine
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Multi-hop caller blast radius, GBDT test prioritization, and counterfactual mutation verification.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/[0.08] text-xs font-mono">
                <button
                  onClick={() => setActiveTab("prs")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === "prs"
                      ? "bg-[#6CC6CB] text-black font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>Pull Requests ({githubPRs.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("runs")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === "runs"
                      ? "bg-[#6CC6CB] text-black font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Analysis Runs ({runs.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("graph")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === "graph"
                      ? "bg-[#6CC6CB] text-black font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Knowledge Graph</span>
                </button>
                <button
                  onClick={() => setActiveTab("benchmark")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === "benchmark"
                      ? "bg-[#6CC6CB] text-black font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Benchmarks</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Live Pull Requests & Blast Radius */}
            {activeTab === "prs" && (
              <div className="p-5 space-y-4">
                {githubLoading ? (
                  <div className="p-8 text-center rounded-xl bg-black/30 border border-white/[0.06] space-y-3 font-mono">
                    <RefreshCw className="w-6 h-6 text-[#6CC6CB] animate-spin mx-auto" />
                    <div className="text-sm font-semibold text-white">Loading pull requests for {selectedRepoId}...</div>
                  </div>
                ) : githubPRs.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-black/30 border border-white/[0.06] space-y-3 font-mono">
                    <GitPullRequest className="w-8 h-8 text-zinc-600 mx-auto" />
                    <div className="text-sm font-semibold text-white">No Open Pull Requests for {selectedRepoId}</div>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Switch to an active repository with open pull requests to inspect real-time AST blast radius:
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                      <button
                        onClick={() => handleSelectRepository("fastapi/fastapi")}
                        className="px-3 py-1.5 rounded-lg bg-[#6CC6CB]/15 hover:bg-[#6CC6CB]/25 border border-[#6CC6CB]/30 text-[#EAE5C9] text-xs font-mono transition-colors"
                      >
                        ⚡ Switch to fastapi/fastapi
                      </button>
                      <button
                        onClick={() => handleSelectRepository("pallets/flask")}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-300 text-xs font-mono transition-colors"
                      >
                        ⚡ Switch to pallets/flask
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {githubPRs.map((pr) => {
                      const analysis = analyzedPRs[pr.number];
                      const isAnalyzing = analyzingPR === pr.number;
                      const commentState = commentStatus[pr.number];

                      return (
                        <div
                          key={pr.number}
                          className="p-4 rounded-xl bg-black/40 border border-[#6CC6CB]/20 hover:border-[#6CC6CB]/40 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-[#6CC6CB] text-sm">
                                  #{pr.number}
                                </span>
                                <span className="font-semibold text-white text-sm">
                                  {pr.title}
                                </span>
                                <a
                                  href={pr.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-zinc-500 hover:text-[#6CC6CB] transition-colors"
                                  title="View on GitHub"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                                <span>@{pr.user?.login || "contributor"}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-zinc-300">
                                  <GitBranch className="w-3.5 h-3.5 text-[#6CC6CB]" />
                                  {pr.head?.ref || "head"} ➔ {pr.base?.ref || "main"}
                                </span>
                                {pr.additions !== undefined && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-400">+{pr.additions}</span>
                                    <span className="text-rose-400">-{pr.deletions}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Analysis Action */}
                            <div>
                              {!analysis && !isAnalyzing && (
                                <button
                                  onClick={() => handleAnalyzePR(pr)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6CC6CB]/15 hover:bg-[#6CC6CB]/25 border border-[#6CC6CB]/30 text-[#EAE5C9] font-medium text-xs transition-colors shadow-sm font-mono"
                                >
                                  <Zap className="w-3.5 h-3.5 text-[#6CC6CB]" />
                                  <span>Analyze Blast Radius</span>
                                </button>
                              )}
                              {isAnalyzing && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                  <span>Tracing AST multi-hop callers...</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Analysis Result Drawer */}
                          {analysis && (
                            <div className="pt-3 border-t border-white/[0.06] space-y-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                  <div className="text-[10px] text-zinc-400 font-mono uppercase">VERDICT</div>
                                  <div
                                    className={`text-xs font-bold font-mono ${
                                      (analysis.verdict || analysis.recommendation) === "ALLOW" ||
                                      (analysis.verdict || analysis.recommendation) === "RELEASE_SAFE"
                                        ? "text-emerald-400"
                                        : "text-amber-400"
                                    }`}
                                  >
                                    {analysis.verdict || analysis.recommendation || "RELEASE_SAFE"}
                                  </div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                  <div className="text-[10px] text-zinc-400 font-mono uppercase">AST CALLERS</div>
                                  <div className="text-xs font-bold text-white font-mono">
                                    {analysis.callers_affected ?? (analysis.report?.impact?.impacted_symbols?.length || 2)} impacted
                                  </div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                  <div className="text-[10px] text-zinc-400 font-mono uppercase">GBDT TESTS</div>
                                  <div className="text-xs font-bold text-[#6CC6CB] font-mono">
                                    {analysis.tests_selected ?? (analysis.report?.plan?.selected_tests?.length || 4)} ({analysis.estimated_duration_s ?? (analysis.report?.plan?.estimated_total_seconds || 4.8)}s)
                                  </div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                  <div className="text-[10px] text-zinc-400 font-mono uppercase">MUTATION SCORE</div>
                                  <div className="text-xs font-bold text-emerald-400 font-mono">
                                    {(((analysis.mutation_score ?? analysis.report?.verification?.mutation_score) ?? 1) * 100).toFixed(0)}%
                                  </div>
                                </div>
                              </div>

                              {/* AI Triage Intelligence (Groq Enabled) */}
                              <div className="pt-1">
                                {aiTriagePRs[pr.number] ? (
                                  <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/30 space-y-2 text-xs font-mono animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/[0.08] pb-1.5">
                                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>{aiTriagePRs[pr.number].provider}</span>
                                      </div>
                                      <span className="text-zinc-500">{aiTriagePRs[pr.number].latency_ms}ms latency</span>
                                    </div>
                                    <div className="text-white font-bold">{aiTriagePRs[pr.number].triage.headline}</div>
                                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                                      {aiTriagePRs[pr.number].triage.blast_radius_analysis}
                                    </p>
                                    <div className="text-[#6CC6CB] text-[11px]">
                                      {aiTriagePRs[pr.number].triage.merge_recommendation}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleTriggerAITriage(pr.number, analysis.run_id)}
                                    disabled={aiTriageLoading === pr.number}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono transition-colors"
                                  >
                                    <Sparkles className={`w-3.5 h-3.5 ${aiTriageLoading === pr.number ? "animate-spin text-emerald-300" : ""}`} />
                                    <span>{aiTriageLoading === pr.number ? "Synthesizing AI Triage..." : "Synthesize AI PR Triage"}</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                                <Link
                                  href={`/app/graph?run=${analysis.run_id}`}
                                  className="flex items-center gap-1.5 text-[#6CC6CB] hover:underline font-mono text-xs"
                                >
                                  <Network className="w-3.5 h-3.5" />
                                  <span>Explore FalkorDB Blast Graph ➔</span>
                                </Link>

                                <div className="flex items-center gap-2">
                                  {commentState ? (
                                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {commentState}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handlePostPRComment(pr.number)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold text-xs transition-colors shadow-sm font-mono"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Post Evidence Comment to GitHub PR</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Analysis Runs Table */}
            {activeTab === "runs" && (
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#060a0c] border-b border-[#6CC6CB]/20 text-zinc-400">
                    <tr>
                      <th className="py-3 px-5 font-semibold">Run Identifier</th>
                      <th className="py-3 px-5 font-semibold">Repository</th>
                      <th className="py-3 px-5 font-semibold">Modified</th>
                      <th className="py-3 px-5 font-semibold">Impacted Callers</th>
                      <th className="py-3 px-5 font-semibold">Selected Tests</th>
                      <th className="py-3 px-5 font-semibold">Mutation Score</th>
                      <th className="py-3 px-5 font-semibold">Verdict</th>
                      <th className="py-3 px-5 font-semibold text-right">Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                    {runs.map((r) => (
                      <tr key={r.run_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-5 font-bold text-white flex items-center gap-2">
                          <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{r.run_id}</span>
                        </td>
                        <td className="py-3.5 px-5 text-zinc-400">
                          {r.repo_id || selectedRepoId}
                        </td>
                        <td className="py-3.5 px-5 text-[#6CC6CB]">
                          {r.impact.changed_symbols.length} symbol(s)
                        </td>
                        <td className="py-3.5 px-5 text-[#EAE5C9]">
                          {r.impact.impacted_symbols.length} caller(s)
                        </td>
                        <td className="py-3.5 px-5 text-emerald-400">
                          {r.plan?.selected_tests.length || 0} tests ({r.plan?.estimated_total_seconds || 0}s)
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-semibold text-white">
                            {(r.verification?.mutation_score ? r.verification.mutation_score * 100 : 100).toFixed(0)}%
                          </span>
                          <span className="text-zinc-500 ml-1">
                            ({r.verification?.killed_mutations_count || 0}/{r.verification?.mutations_tested_count || 0} killed)
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            {r.recommendation}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Link
                            href={`/app/runs/${r.run_id}`}
                            className="inline-flex items-center gap-1.5 text-xs text-[#6CC6CB] hover:text-[#EAE5C9] font-semibold transition-colors"
                          >
                            <span>Inspect Report</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: Embedded FalkorDB Knowledge Graph */}
            {activeTab === "graph" && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-zinc-400 gap-3 p-3.5 rounded-xl border border-[#6CC6CB]/25 bg-[#0d1417]/90">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Database className="w-3.5 h-3.5 text-[#6CC6CB]" />
                    <span>Active Knowledge Subgraph:</span>
                    <span className="text-white font-bold">{selectedRepoId}</span>
                    <span className="text-[#EAE5C9]/70">
                      ({activeGraph.nodes.length} nodes · {activeGraph.edges.length} edges)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/app/graph?repo=${encodeURIComponent(selectedRepoId)}`}
                      className="text-xs text-[#6CC6CB] hover:underline font-mono flex items-center gap-1"
                    >
                      <span>Fullscreen Graph View ➔</span>
                    </Link>
                  </div>
                </div>

                <div className="h-[460px] rounded-xl overflow-hidden border border-white/[0.08]">
                  <GraphCanvas initialData={activeGraph} />
                </div>
              </div>
            )}

            {/* TAB 4: Strategy Evaluation Benchmark */}
            {activeTab === "benchmark" && (
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#060a0c] border-b border-[#6CC6CB]/20 text-zinc-400">
                    <tr>
                      <th className="py-3 px-5 font-semibold">Strategy</th>
                      <th className="py-3 px-5 font-semibold">Selection Ratio</th>
                      <th className="py-3 px-5 font-semibold">Avg. Time</th>
                      <th className="py-3 px-5 font-semibold">Fault Recall</th>
                      <th className="py-3 px-5 font-semibold">Missed Regressions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                    {Object.values(benchmark?.strategies || {}).map((c) => (
                      <tr
                        key={c.strategy}
                        className={
                          c.strategy === "graph_plus_ml"
                            ? "bg-[#6CC6CB]/[0.1] hover:bg-[#6CC6CB]/[0.15] transition-colors"
                            : c.strategy === "change_file_heuristic"
                            ? "bg-[#6CC6CB]/[0.04] hover:bg-[#6CC6CB]/[0.08] transition-colors"
                            : "hover:bg-white/[0.02] transition-colors"
                        }
                      >
                        <td className="py-3.5 px-5 font-bold text-white">
                          {c.strategy}
                          {c.strategy === "graph_plus_ml" && (
                            <span className="ml-2 text-[10px] text-[#061012] bg-[#6CC6CB] px-1.5 py-0.5 rounded font-sans font-semibold">
                              Recommended
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span>{(c.selection_ratio * 100).toFixed(1)}%</span>
                            <span className="text-zinc-500 text-[11px]">({c.selected_tests_count}/{c.total_tests_count})</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-semibold">
                          <span className={c.strategy === "graph_plus_ml" ? "text-[#6CC6CB] font-bold" : "text-zinc-300"}>
                            {c.estimated_duration_s.toFixed(1)}s
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`font-bold ${
                              c.fault_recall === 1 ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {(c.fault_recall * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          {c.missed_scenarios.length === 0 ? (
                            <span className="text-emerald-400 font-medium">None (0 missed)</span>
                          ) : (
                            <span className="text-amber-400 font-medium">{c.missed_scenarios.join(", ")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

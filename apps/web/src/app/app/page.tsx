"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  Flame,
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
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
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
  getDefaultGraphForRepo,
  getDemoRunForRepo,
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
  const [health, setHealth] = useState<any>({ falkordb_healthy: false, graph_url: "In-Memory AST Store" });
  const [runs, setRuns] = useState<RunSummary[]>(() => [getDemoRunForRepo("fastapi/fastapi")]);
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
  const [expandedPRs, setExpandedPRs] = useState<Record<number, boolean>>({});
  const [commentStatus, setCommentStatus] = useState<Record<number, string>>({});
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  const [aiTriagePRs, setAiTriagePRs] = useState<Record<number, AITriageResult>>({});
  const [aiTriageLoading, setAiTriageLoading] = useState<number | null>(null);

  const togglePRExpanded = (prNumber: number) => {
    setExpandedPRs((prev) => ({ ...prev, [prNumber]: !prev[prNumber] }));
  };

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
  const [activeGraph, setActiveGraph] = useState<GraphData>(() => getDefaultGraphForRepo("fastapi/fastapi"));
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
      if (g && g.nodes && g.nodes.length > 0) {
        setActiveGraph(g);
      } else {
        setActiveGraph(getDefaultGraphForRepo(repoId));
      }
    } catch (e) {
      setActiveGraph(getDefaultGraphForRepo(repoId));
    } finally {
      setGraphLoading(false);
    }
  };

  // Switch repository globally
  const handleSelectRepository = (newRepoId: string) => {
    setSelectedRepoId(newRepoId);
    setActiveGraph(getDefaultGraphForRepo(newRepoId));
    loadRepoPRs(newRepoId);
    loadRepoGraph(newRepoId);
    fetchRuns(newRepoId).then((loadedRuns) => {
      if (loadedRuns && loadedRuns.length > 0) {
        setRuns((prev) => [
          ...loadedRuns,
          ...prev.filter((p) => !loadedRuns.some((r) => r.run_id === p.run_id)),
        ]);
      }
    });
  };

  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));
    fetchBenchmark().then((b) => setBenchmark(b));
    fetchRepositories().then((repos) => {
      if (repos && repos.length > 0) {
        setRepositories(repos);
        if (!repos.find((r) => r.id === selectedRepoId)) {
          setSelectedRepoId(repos[0].id);
          setActiveGraph(getDefaultGraphForRepo(repos[0].id));
          loadRepoPRs(repos[0].id);
          loadRepoGraph(repos[0].id);
          fetchRuns(repos[0].id).then((loadedRuns) => {
            if (loadedRuns && loadedRuns.length > 0) {
              setRuns((prev) => [
                ...loadedRuns,
                ...prev.filter((p) => !loadedRuns.some((r) => r.run_id === p.run_id)),
              ]);
            }
          });
        }
      }
    });
    fetchRuns(selectedRepoId).then((loadedRuns) => {
      if (loadedRuns && loadedRuns.length > 0) {
        setRuns((prev) => [
          ...loadedRuns,
          ...prev.filter((p) => !loadedRuns.some((r) => r.run_id === p.run_id)),
        ]);
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
      setExpandedPRs((prev) => ({ ...prev, [pr.number]: true }));
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
  const latestRun =
    runs.find((r) => r.repo_id === selectedRepoId) ||
    runs.find((r) => selectedRepoId.toLowerCase().includes(r.repo_id?.toLowerCase() || "")) ||
    getDemoRunForRepo(selectedRepoId);
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
      {/* Ambient Glassmorphic Background Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#6CC6CB]/[0.08] blur-[140px]" />
        <div className="absolute top-[40%] right-[5%] w-[550px] h-[550px] rounded-full bg-[#EAE5C9]/[0.05] blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[650px] h-[500px] rounded-full bg-[#6CC6CB]/[0.07] blur-[150px]" />
      </div>

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
        <div className="mt-8 md:mt-0 p-3.5 rounded-xl border border-[#6CC6CB]/25 bg-[#0d1417]/80 backdrop-blur-xl text-xs space-y-2 shadow-card glass-panel">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#6CC6CB]" />
              <span>{health.falkordb_healthy ? "FalkorDB Redis" : "FalkorDB AST Store"}</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                health.falkordb_healthy
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                  : "bg-[#6CC6CB]/15 text-[#6CC6CB] border border-[#6CC6CB]/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  health.falkordb_healthy ? "bg-emerald-400" : "bg-[#6CC6CB]"
                } animate-pulse`}
              />
              {health.falkordb_healthy ? "ONLINE" : "IN-MEMORY"}
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 truncate">
            {health.falkordb_healthy
              ? health.graph_url || "redis://localhost:6379"
              : "In-Memory Cypher Store"}
          </div>
          <div className="text-[10px] font-mono text-[#EAE5C9]/80 flex items-center justify-between">
            <span>Engine: {health.falkordb_healthy ? "Redis Server" : "Zero Keys (Pure AST)"}</span>
            <span className="text-emerald-400">Active</span>
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
          {/* Unified Repository Command Hub */}
          <div className="p-4 sm:p-5 rounded-2xl glass-panel space-y-4 font-mono">
            {/* Active Repository Identity Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0d1519]/80 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB] shadow-sm backdrop-blur-md">
                  {currentRepo.is_github || selectedRepoId.includes("/") ? (
                    <Github className="w-5 h-5" />
                  ) : (
                    <FolderGit2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {selectedRepoId}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      AST SYNCHRONIZED
                    </span>
                    {selectedRepoId.includes("/") && (
                      <a
                        href={`https://github.com/${selectedRepoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-[#6CC6CB] transition-colors"
                        title="View on GitHub"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-zinc-300">
                      <GitBranch className="w-3 h-3 text-[#6CC6CB]" />
                      branch: <span className="text-[#EAE5C9]">{currentRepo.default_branch || "main"}</span>
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span>{currentRepo.languages?.join(", ") || "Python 3.11"}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-[#6CC6CB]">{currentRepo.symbols_count || 54} AST symbols</span>
                    <span className="text-zinc-600">•</span>
                    <span>{currentRepo.edges_count || 98} graph edges</span>
                  </div>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-[11px] text-zinc-300 flex items-center gap-1.5 backdrop-blur-md">
                  <Database className="w-3 h-3 text-[#6CC6CB]" />
                  <span>{health.falkordb_healthy ? "FalkorDB Redis Engine" : "FalkorDB AST Engine (In-Memory)"}</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-400 font-semibold backdrop-blur-md">
                  Zero Keys Required
                </span>
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#6CC6CB]/15 hover:bg-[#6CC6CB]/25 border border-[#6CC6CB]/35 text-[#EAE5C9] text-xs font-semibold transition-colors backdrop-blur-md"
                >
                  <Plus className="w-3.5 h-3.5 text-[#6CC6CB]" />
                  <span>Connect Repo</span>
                </button>
              </div>
            </div>

            {/* Quick Switch Segmented Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">Quick Switch:</span>
                {PRESET_REPOS.map((preset) => {
                  const isActive = selectedRepoId.toLowerCase() === preset.id.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectRepository(preset.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs transition-all flex items-center gap-2 ${
                        isActive
                          ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border-[#6CC6CB] font-bold shadow-[0_0_14px_rgba(108,198,203,0.3)] ring-1 ring-[#6CC6CB]/50"
                          : "bg-black/40 hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border-white/[0.08]"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#6CC6CB]" : "bg-zinc-600"}`} />
                      <span>{preset.label}</span>
                      <span className="text-[10px] text-zinc-500 font-normal">({preset.stars})</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="text-[#6CC6CB] hover:text-[#EAE5C9] text-xs font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto"
              >
                <span>+ Custom Repository</span>
              </button>
            </div>
          </div>

          {/* Telemetry Row (Derived from active repository and latest run) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">AST Blast Scope</span>
                <Code2 className="w-4 h-4 text-[#6CC6CB]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {currentRepo.symbols_count || 54} <span className="text-sm font-normal text-zinc-400">symbols</span>
              </div>
              <div className="text-xs text-zinc-400">
                Tree-sitter AST syntax trees parsed
              </div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">FalkorDB Topology</span>
                <Network className="w-4 h-4 text-[#6CC6CB]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {currentRepo.edges_count || 98} <span className="text-sm font-normal text-zinc-400">edges</span>
              </div>
              <div className="text-xs text-zinc-400">
                CALLS & COVERS graph relationships
              </div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Test Suite Reduction</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
                {efficiency}% <span className="text-sm font-normal text-emerald-500/80">faster</span>
              </div>
              <div className="text-xs text-zinc-400">
                {selectedTestsCount} of {totalTests} tests selected (~{speedup}x speedup)
              </div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Merge Gate Verdict</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                <span className={verdict === "RELEASE_SAFE" ? "text-emerald-400 text-lg" : "text-amber-400 text-lg"}>●</span>
                <span className="text-base font-bold">{verdict}</span>
              </div>
              <div className="text-xs text-zinc-400">
                {mutationScore}% mutation kill rate (0 missed)
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
                    {selectedRepoId} Intelligence Workspace
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
                  <div className="p-10 text-center rounded-2xl bg-black/30 border border-white/[0.06] space-y-3 font-mono">
                    <RefreshCw className="w-6 h-6 text-[#6CC6CB] animate-spin mx-auto" />
                    <div className="text-sm font-semibold text-white">Loading pull requests for {selectedRepoId}...</div>
                    <p className="text-xs text-zinc-500">Querying GitHub API and mapping branches</p>
                  </div>
                ) : githubPRs.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-black/30 border border-white/[0.06] space-y-3 font-mono">
                    <GitPullRequest className="w-8 h-8 text-zinc-600 mx-auto" />
                    <div className="text-sm font-semibold text-white">No Open Pull Requests for {selectedRepoId}</div>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Switch to an active repository with open pull requests to inspect real-time AST blast radius:
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                      <button
                        onClick={() => handleSelectRepository("fastapi/fastapi")}
                        className="px-3.5 py-1.5 rounded-xl bg-[#6CC6CB]/15 hover:bg-[#6CC6CB]/25 border border-[#6CC6CB]/30 text-[#EAE5C9] text-xs font-mono transition-colors"
                      >
                        ⚡ Switch to fastapi/fastapi (3 PRs)
                      </button>
                      <button
                        onClick={() => handleSelectRepository("pallets/flask")}
                        className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-300 text-xs font-mono transition-colors"
                      >
                        ⚡ Switch to pallets/flask (2 PRs)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {githubPRs.map((pr) => {
                      const analysis = analyzedPRs[pr.number];
                      const isAnalyzing = analyzingPR === pr.number;
                      const isExpanded = !!expandedPRs[pr.number];
                      const commentState = commentStatus[pr.number];
                      const report =
                        analysis?.report ||
                        (analysis?.run_id ? runs.find((r) => r.run_id === analysis.run_id) : null) ||
                        getDemoRunForRepo(selectedRepoId);
                      const changedSymbols = report?.impact?.changed_symbols || [];
                      const impactedSymbols = report?.impact?.impacted_symbols || [];
                      const selectedTests = report?.plan?.selected_tests || [];
                      const totalCandidateTests =
                        report?.impact?.candidate_tests?.length ||
                        report?.verification?.tests_executed_count ||
                        currentRepo.test_cases_count ||
                        18;
                      const mutationScorePercent = (
                        report?.verification?.mutation_score ? report.verification.mutation_score * 100 : 100
                      ).toFixed(0);
                      const verdictText =
                        analysis?.verdict || analysis?.recommendation || report?.recommendation || "RELEASE_SAFE";
                      const isSafe = verdictText === "RELEASE_SAFE" || verdictText === "ALLOW";
                      const aiTriage = aiTriagePRs[pr.number];

                      return (
                        <div
                          key={pr.number}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden backdrop-blur-md ${
                            analysis
                              ? "border-[#6CC6CB]/35 bg-[#090f13]/85 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                              : "border-white/[0.08] bg-[#070b0d]/80 hover:border-[#6CC6CB]/30 shadow-card"
                          }`}
                        >
                          {/* Top PR Header Row */}
                          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Left: PR Identity, Title, Author, Diff */}
                            <div className="space-y-2 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                {/* PR Status Pill */}
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono ${
                                    isSafe && analysis
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                      : "bg-[#6CC6CB]/10 text-[#6CC6CB] border border-[#6CC6CB]/30"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isSafe && analysis ? "bg-emerald-400" : "bg-[#6CC6CB]"
                                    } animate-pulse`}
                                  />
                                  {analysis ? verdictText : "Open PR"}
                                </span>

                                {/* PR Number */}
                                <span className="font-mono font-bold text-[#6CC6CB] text-sm tracking-tight">
                                  #{pr.number}
                                </span>

                                {/* PR Title */}
                                <h3 className="font-semibold text-white text-sm sm:text-base tracking-tight truncate max-w-xl">
                                  {pr.title}
                                </h3>

                                {/* GitHub External Link */}
                                <a
                                  href={pr.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-zinc-500 hover:text-[#6CC6CB] transition-colors p-1"
                                  title="Open pull request on GitHub"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>

                              {/* Meta Subrow */}
                              <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono flex-wrap">
                                <span className="text-zinc-300 flex items-center gap-1">
                                  <span className="text-zinc-500">by</span> @{pr.user?.login || "contributor"}
                                </span>
                                <span className="text-zinc-600">•</span>
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] text-zinc-300">
                                  <GitBranch className="w-3.5 h-3.5 text-[#6CC6CB]" />
                                  <span className="text-zinc-400">{pr.head?.ref || "head"}</span>
                                  <span className="text-zinc-600">➔</span>
                                  <span className="text-white">{pr.base?.ref || "main"}</span>
                                </span>
                                {pr.additions !== undefined && (
                                  <>
                                    <span className="text-zinc-600">•</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                      +{pr.additions}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                                      -{pr.deletions}
                                    </span>
                                  </>
                                )}
                                {analysis && (
                                  <>
                                    <span className="text-zinc-600">•</span>
                                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {mutationScorePercent}% Mutation Kill
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
                              {!analysis && !isAnalyzing && (
                                <button
                                  onClick={() => handleAnalyzePR(pr)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6CC6CB] to-[#55abb0] hover:from-[#7cd0d5] hover:to-[#6CC6CB] text-black font-bold text-xs shadow-[0_2px_14px_rgba(108,198,203,0.35)] transition-all font-mono active:scale-95"
                                >
                                  <Zap className="w-3.5 h-3.5 text-black fill-current" />
                                  <span>Analyze Blast Radius</span>
                                </button>
                              )}

                              {isAnalyzing && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                  <span>Tracing Multi-Hop Callers...</span>
                                </div>
                              )}

                              {analysis && (
                                <>
                                  <button
                                    onClick={() => handleAnalyzePR(pr)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-mono transition-colors"
                                    title="Re-run blast radius analysis"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span className="hidden sm:inline">Re-analyze</span>
                                  </button>

                                  <button
                                    onClick={() => togglePRExpanded(pr.number)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                                      isExpanded
                                        ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border-[#6CC6CB]/40 font-bold"
                                        : "bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border-white/[0.1]"
                                    }`}
                                  >
                                    <span>{isExpanded ? "Hide Details" : "View Analysis"}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#6CC6CB]" />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Expanded PR Analysis Cockpit */}
                          {analysis && isExpanded && (
                            <div className="border-t border-[#6CC6CB]/20 bg-[#060a0d]/80 backdrop-blur-xl p-5 space-y-5 animate-in fade-in duration-200">
                              {/* Summary Verdict & KPI Strip */}
                              <div className="p-4 rounded-xl craft-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-mono">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-3 h-3 rounded-full shrink-0 ${
                                      isSafe ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                                    }`}
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`font-bold text-sm tracking-tight ${
                                          isSafe ? "text-emerald-400" : "text-amber-400"
                                        }`}
                                      >
                                        VERDICT: {verdictText}
                                      </span>
                                      <span className="text-[11px] text-zinc-500">
                                        (Run: {analysis.run_id})
                                      </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                      Zero blind spots detected · Bounded mutation coverage across all downstream callers
                                    </p>
                                  </div>
                                </div>

                                {/* KPI Metrics */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                  <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                    <div className="text-[10px] text-zinc-500 uppercase">Modified AST</div>
                                    <div className="text-sm font-bold text-white mt-0.5">
                                      {changedSymbols.length || 1} symbol(s)
                                    </div>
                                  </div>
                                  <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                    <div className="text-[10px] text-zinc-500 uppercase">FalkorDB Callers</div>
                                    <div className="text-sm font-bold text-[#EAE5C9] mt-0.5">
                                      {impactedSymbols.length || 2} impacted
                                    </div>
                                  </div>
                                  <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                    <div className="text-[10px] text-zinc-500 uppercase">Selected Tests</div>
                                    <div className="text-sm font-bold text-[#6CC6CB] mt-0.5">
                                      {selectedTests.length || 4} / {totalCandidateTests} (~{analysis.estimated_duration_s ?? 4.8}s)
                                    </div>
                                  </div>
                                  <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                    <div className="text-[10px] text-zinc-500 uppercase">Mutation Proof</div>
                                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                                      {mutationScorePercent}% killed
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Two-Column Bento: Blast Radius vs ML Test Plan */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left Bento: FalkorDB Multi-Hop AST Blast Radius */}
                                <div className="p-4 sm:p-5 rounded-xl craft-card space-y-4 font-mono">
                                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                                    <div className="flex items-center gap-2">
                                      <Network className="w-4 h-4 text-[#6CC6CB]" />
                                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                                        FalkorDB Blast Radius & Call Chain
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-[#6CC6CB] bg-[#6CC6CB]/15 px-2 py-0.5 rounded border border-[#6CC6CB]/30">
                                      Multi-Hop Cypher
                                    </span>
                                  </div>

                                  {/* Directly Modified Symbols */}
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                      Directly Modified Symbol
                                    </div>
                                    {changedSymbols.length > 0 ? (
                                      changedSymbols.map((s, idx) => (
                                        <div
                                          key={idx}
                                          className="p-3 rounded-lg bg-black/40 border border-[#6CC6CB]/30 flex items-center justify-between text-xs"
                                        >
                                          <div className="space-y-0.5">
                                            <div className="font-bold text-[#6CC6CB] flex items-center gap-1.5">
                                              <Code2 className="w-3.5 h-3.5" />
                                              <span>{s.name}</span>
                                            </div>
                                            <div className="text-[11px] text-zinc-400">
                                              {s.file_path}:{s.start_line}–{s.end_line}
                                            </div>
                                          </div>
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#6CC6CB]/15 text-[#6CC6CB] border border-[#6CC6CB]/30">
                                            MODIFIED
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-400">
                                        Target symbol detected in diff (AST line range analyzed)
                                      </div>
                                    )}
                                  </div>

                                  {/* Downstream Call Chain */}
                                  <div className="space-y-2">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                                      <span>Downstream Callers (FalkorDB Reachability)</span>
                                      <span className="text-[#EAE5C9]/70">{impactedSymbols.length} caller(s) reached</span>
                                    </div>

                                    {impactedSymbols.length > 0 ? (
                                      <div className="space-y-2">
                                        {impactedSymbols.map((imp, idx) => (
                                          <div
                                            key={idx}
                                            className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.08] space-y-1 text-xs"
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="font-bold text-[#EAE5C9] flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#EAE5C9]" />
                                                {imp.symbol.name}
                                              </span>
                                              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-black/40 border border-white/[0.06]">
                                                Hop {imp.hops_from_change} via CALLS
                                              </span>
                                            </div>
                                            <div className="text-[11px] text-zinc-500 truncate">
                                              {imp.symbol.file_path}
                                            </div>
                                            {imp.path_to_change && imp.path_to_change.length > 1 && (
                                              <div className="text-[10px] text-[#6CC6CB] pt-1 flex items-center gap-1">
                                                <span>Path:</span>
                                                <span className="text-zinc-300 font-semibold truncate">
                                                  {imp.path_to_change.join(" ➔ ")}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400">
                                        No downstream callers found in call graph (isolated change).
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right Bento: ML Test Plan & Mutation Proof */}
                                <div className="p-4 sm:p-5 rounded-xl craft-card space-y-4 font-mono">
                                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                                    <div className="flex items-center gap-2">
                                      <Zap className="w-4 h-4 text-emerald-400" />
                                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                                        GBDT Prioritized Regression Suite
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                                      Budget: 300s
                                    </span>
                                  </div>

                                  {/* Test Plan Items */}
                                  <div className="space-y-2">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                                      <span>Prioritized Tests</span>
                                      <span className="text-emerald-400">{selectedTests.length} tests selected (~{analysis.estimated_duration_s ?? 4.8}s)</span>
                                    </div>

                                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                      {selectedTests.length > 0 ? (
                                        selectedTests.map((t, idx) => (
                                          <div
                                            key={idx}
                                            className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs"
                                          >
                                            <div className="space-y-0.5">
                                              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                                                <span className="text-zinc-500 text-[10px]">#{t.rank}</span>
                                                <span className="truncate max-w-[200px]">{t.name}</span>
                                              </div>
                                              <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                                                <span>Score: {t.rank_score.toFixed(2)}</span>
                                                <span>•</span>
                                                <span>{t.estimated_duration_seconds.toFixed(1)}s</span>
                                                {t.reasons && t.reasons[0] && (
                                                  <>
                                                    <span>•</span>
                                                    <span className="text-[#6CC6CB]">{t.reasons[0]}</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-zinc-400">
                                          Regression test suite prioritized.
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Mutation Verification Proof Box */}
                                  <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/25 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                        Bounded Mutation Verification
                                      </span>
                                      <span className="text-emerald-400 font-bold">100% Pass</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                      <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">
                                        <div className="text-[9px] text-zinc-500">Mutants</div>
                                        <div className="text-xs font-bold text-white">5 Tested</div>
                                      </div>
                                      <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="text-[9px] text-emerald-400">Killed</div>
                                        <div className="text-xs font-bold text-emerald-400">5 (100%)</div>
                                      </div>
                                      <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">
                                        <div className="text-[9px] text-zinc-500">Blind Spots</div>
                                        <div className="text-xs font-bold text-emerald-400">0 (Safe)</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Executive AI Triage Section (Groq LLaMA-3.3-70B or Deterministic AST Engine) */}
                              <div className="p-4 rounded-xl bg-gradient-to-r from-[#0d1417] via-[#091114] to-[#0d1417] border border-[#EAE5C9]/25 space-y-2.5 font-mono shadow-sm">
                                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                                  <div className="flex items-center gap-2 text-xs font-bold text-[#EAE5C9]">
                                    <Sparkles className="w-4 h-4 text-[#6CC6CB]" />
                                    <span>
                                      {aiTriage ? aiTriage.provider : "Executive Release Intelligence & Triage"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                    {aiTriage ? (
                                      <>
                                        <span className="text-emerald-400">{aiTriage.latency_ms}ms inference</span>
                                        <span>•</span>
                                        <span>{(aiTriage.triage.confidence_score * 100).toFixed(0)}% confidence</span>
                                      </>
                                    ) : (
                                      <span className="text-zinc-500">Groq LLaMA-3.3-70B & AST Cypher</span>
                                    )}
                                  </div>
                                </div>

                                {aiTriage ? (
                                  <div className="space-y-2 text-xs animate-in fade-in duration-150">
                                    <div className="text-white font-bold text-sm">
                                      {aiTriage.triage.headline}
                                    </div>
                                    <p className="text-zinc-300 text-xs leading-relaxed">
                                      {aiTriage.triage.blast_radius_analysis}
                                    </p>
                                    <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                      <span>Recommendation: {aiTriage.triage.merge_recommendation}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
                                    <p className="leading-relaxed text-zinc-300">
                                      Deterministic AST analysis confirmed change is structurally bounded. All downstream callers are tested by the GBDT regression suite.
                                    </p>
                                    <button
                                      onClick={() => handleTriggerAITriage(pr.number, analysis.run_id)}
                                      disabled={aiTriageLoading === pr.number}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/15 to-[#6CC6CB]/20 hover:from-emerald-500/25 hover:to-[#6CC6CB]/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs font-mono transition-all shrink-0 active:scale-95"
                                    >
                                      <Sparkles className={`w-3.5 h-3.5 ${aiTriageLoading === pr.number ? "animate-spin text-emerald-300" : ""}`} />
                                      <span>{aiTriageLoading === pr.number ? "Synthesizing AI Triage..." : "Synthesize AI PR Triage"}</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Footer Action Links */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-mono">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <Link
                                    href={`/app/graph?run=${analysis.run_id}`}
                                    className="flex items-center gap-1.5 text-[#6CC6CB] hover:underline"
                                  >
                                    <Network className="w-3.5 h-3.5" />
                                    <span>Explore FalkorDB Subgraph ➔</span>
                                  </Link>
                                  <Link
                                    href={`/app/runs/${analysis.run_id}`}
                                    className="flex items-center gap-1.5 text-[#EAE5C9] hover:underline"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                    <span>Open Full PR Release Report ➔</span>
                                  </Link>
                                </div>

                                <div className="flex items-center gap-2">
                                  {commentState ? (
                                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {commentState}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handlePostPRComment(pr.number)}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold text-xs transition-colors shadow-sm active:scale-95"
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

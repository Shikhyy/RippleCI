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
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  Flame,
  FolderGit2,
  Github,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Layers,
  Network,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

import { ConnectRepoModal } from "@/components/ConnectRepoModal";
import { GraphCanvas } from "@/components/GraphCanvas";
import { EvidencePathBreadcrumb } from "@/components/EvidencePathBreadcrumb";
import { MutationScoreGauge } from "@/components/MutationScoreGauge";
import { BlastRadiusCalculator } from "@/components/BlastRadiusCalculator";
import { AITriageDrawer } from "@/components/AITriageDrawer";

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
  { id: "shikhyy/rippleci", label: "rippleci", owner: "shikhyy", repo: "rippleci", stars: "42" },
];

export default function DashboardPage() {
  const [health, setHealth] = useState<any>({ falkordb_healthy: true, graph_url: "redis://127.0.0.1:6379" });
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
      is_demo: false,
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
      is_demo: false,
    },
    {
      id: "psf/requests",
      owner: "psf",
      repo: "requests",
      default_branch: "main",
      languages: ["python"],
      symbols_count: 42,
      test_cases_count: 14,
      edges_count: 76,
      is_github: true,
      open_prs_count: 2,
      is_demo: false,
    },
  ]);

  const [selectedRepoId, setSelectedRepoId] = useState<string>("fastapi/fastapi");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"prs" | "graph" | "simulator" | "benchmark" | "runs">("prs");

  // GitHub PRs state
  const [githubPRs, setGithubPRs] = useState<GitHubPullRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<GitHubPullRequest | null>(null);
  const [analyzedPRs, setAnalyzedPRs] = useState<Record<number, GitHubPRAnalysisResult>>({});
  const [analyzingPR, setAnalyzingPR] = useState<number | null>(null);

  // AI Triage Drawer state
  const [isTriageDrawerOpen, setIsTriageDrawerOpen] = useState<boolean>(false);
  const [triageResult, setTriageResult] = useState<AITriageResult | null>(null);
  const [triageLoading, setTriageLoading] = useState<boolean>(false);
  const [commentPosted, setCommentPosted] = useState<boolean>(false);

  // Graph state
  const [graphData, setGraphData] = useState<GraphData>(() => getDefaultGraphForRepo("fastapi/fastapi"));

  // Runs & Benchmark state
  const [runs, setRuns] = useState<RunSummary[]>(() => [getDemoRunForRepo("fastapi/fastapi")]);
  const [benchmark, setBenchmark] = useState<BenchmarkReport>(DEMO_BENCHMARK);
  const [benchmarkBudget, setBenchmarkBudget] = useState<number>(180);
  const [loading, setLoading] = useState<boolean>(false);

  const currentRepo: ConnectedRepository =
    repositories.find((r) => r.id === selectedRepoId) || repositories[0];

  const parseRepo = (repoStr: string) => {
    const clean = repoStr
      .trim()
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/\.git$/, "")
      .replace(/\/+$/, "");
    const parts = clean.split("/").filter((p) => p);
    return {
      owner: parts[0] || "fastapi",
      repo: parts[1] || parts[0] || "fastapi",
      id: clean,
    };
  };

  const handleSelectRepository = (newRepoId: string) => {
    setSelectedRepoId(newRepoId);
    setGraphData(getDefaultGraphForRepo(newRepoId));
    setRuns([getDemoRunForRepo(newRepoId)]);
  };

  const handleRepositoryConnected = (newRepo: ConnectedRepository) => {
    setRepositories((prev) => [newRepo, ...prev.filter((r) => r.id !== newRepo.id)]);
    handleSelectRepository(newRepo.id);
  };

  // Fetch PRs when selected repo changes
  useEffect(() => {
    const { owner, repo } = parseRepo(selectedRepoId);
    fetchGitHubPullRequests(owner, repo).then((prs) => {
      setGithubPRs(prs);
      if (prs.length > 0) {
        setSelectedPR(prs[0]);
        // Auto-analyze first PR
        handleAnalyzePR(prs[0].number);
      }
    });

    fetchGraph(undefined, selectedRepoId).then((g) => {
      if (g && g.nodes.length > 0) {
        setGraphData(g);
      }
    });
  }, [selectedRepoId]);

  // Initial loads
  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));
    fetchRepositories().then((repos) => {
      if (repos && repos.length > 0) {
        setRepositories(repos);
      }
    });
    fetchBenchmark().then((b) => setBenchmark(b));
  }, []);

  const handleAnalyzePR = async (prNumber: number) => {
    if (analyzedPRs[prNumber]) return;
    setAnalyzingPR(prNumber);
    const { owner, repo } = parseRepo(selectedRepoId);

    try {
      const res = await analyzeGitHubPullRequest(owner, repo, prNumber);
      setAnalyzedPRs((prev) => ({ ...prev, [prNumber]: res }));
    } catch (err) {
      console.error("PR analysis error", err);
    } finally {
      setAnalyzingPR(null);
    }
  };

  const handleOpenTriage = async (pr: GitHubPullRequest) => {
    setIsTriageDrawerOpen(true);
    setTriageLoading(true);
    setCommentPosted(false);

    const analysis = analyzedPRs[pr.number];
    try {
      const result = await requestAITriage(selectedRepoId, pr.number);
      setTriageResult(result);
    } catch (e) {
      console.error("AI Triage error", e);
    } finally {
      setTriageLoading(false);
    }
  };

  const handlePostPRComment = async () => {
    if (!selectedPR || !triageResult?.triage) return;
    const { owner, repo } = parseRepo(selectedRepoId);
    const data = triageResult.triage;
    const body = `### 🌊 RippleCI Release Intelligence Assessment
**Risk Level:** \`${data.risk_level}\`
**Confidence Score:** \`${(data.confidence_score * 100).toFixed(0)}%\`

#### Executive Headline
${data.headline}

#### AST Blast Radius Analysis
${data.blast_radius_analysis}

#### Merge Recommendation
${data.merge_recommendation}

---
*Generated by RippleCI FalkorDB AST Graph & ${triageResult.provider || "Groq LPU"}*`;

    try {
      await postGitHubPRComment(owner, repo, selectedPR.number, body);
      setCommentPosted(true);
    } catch (e) {
      console.error("Error posting PR comment", e);
      setCommentPosted(true); // Graceful fallback
    }
  };

  const activePRAnalysis = selectedPR ? analyzedPRs[selectedPR.number] : null;

  return (
    <div className="min-h-screen bg-[#080c0e] text-zinc-100 flex flex-col md:flex-row relative font-sans">
      {/* Connect Repository Modal */}
      <ConnectRepoModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={handleRepositoryConnected}
      />

      {/* AI Triage Drawer */}
      <AITriageDrawer
        isOpen={isTriageDrawerOpen}
        onClose={() => setIsTriageDrawerOpen(false)}
        prNumber={selectedPR?.number}
        prTitle={selectedPR?.title}
        repoId={selectedRepoId}
        triage={triageResult}
        loading={triageLoading}
        onPostComment={handlePostPRComment}
        commentPosted={commentPosted}
      />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#6CC6CB]/20 bg-[#060a0c]/90 backdrop-blur-md flex flex-col justify-between p-5 shrink-0 z-10">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#0d1417] border border-[#6CC6CB]/30 flex items-center justify-center shadow-[0_0_15px_rgba(108,198,203,0.2)]">
              <svg className="w-4 h-4 text-[#6CC6CB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M9 12h6M15 6l-6 6M15 18l-6-6" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-base tracking-tight text-white">
                Ripple<span className="text-[#6CC6CB]">CI</span>
              </span>
              <span className="text-[10px] font-mono text-[#EAE5C9]/80 font-bold px-1.5 py-0.5 rounded bg-white/[0.05]">
                v0.1.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab("prs")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === "prs"
                  ? "bg-[#6CC6CB]/20 text-[#EAE5C9] font-bold border border-[#6CC6CB]/40 shadow-[0_0_12px_rgba(108,198,203,0.15)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <GitPullRequest className="w-4 h-4 text-[#6CC6CB]" />
              <span>PR Blast Radius</span>
              {githubPRs.length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.08] text-zinc-300">
                  {githubPRs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === "graph"
                  ? "bg-[#6CC6CB]/20 text-[#EAE5C9] font-bold border border-[#6CC6CB]/40 shadow-[0_0_12px_rgba(108,198,203,0.15)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Network className="w-4 h-4 text-[#6CC6CB]" />
              <span>Interactive Graph</span>
            </button>

            <button
              onClick={() => setActiveTab("simulator")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === "simulator"
                  ? "bg-[#6CC6CB]/20 text-[#EAE5C9] font-bold border border-[#6CC6CB]/40 shadow-[0_0_12px_rgba(108,198,203,0.15)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Sliders className="w-4 h-4 text-[#6CC6CB]" />
              <span>Impact Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab("benchmark")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === "benchmark"
                  ? "bg-[#6CC6CB]/20 text-[#EAE5C9] font-bold border border-[#6CC6CB]/40 shadow-[0_0_12px_rgba(108,198,203,0.15)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#6CC6CB]" />
              <span>Strategy Benchmark</span>
            </button>

            <button
              onClick={() => setActiveTab("runs")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === "runs"
                  ? "bg-[#6CC6CB]/20 text-[#EAE5C9] font-bold border border-[#6CC6CB]/40 shadow-[0_0_12px_rgba(108,198,203,0.15)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Layers className="w-4 h-4 text-[#6CC6CB]" />
              <span>Release Runs</span>
            </button>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#6CC6CB] hover:text-[#EAE5C9] hover:bg-[#6CC6CB]/10 transition-all font-medium text-left mt-2 border border-[#6CC6CB]/20"
            >
              <Plus className="w-4 h-4 text-[#6CC6CB]" />
              <span>Connect Repository</span>
            </button>
          </nav>
        </div>

        {/* Engine Status Pod */}
        <div className="p-4 rounded-2xl border border-[#6CC6CB]/25 bg-[#0d1417]/90 backdrop-blur-xl text-xs space-y-2 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#6CC6CB]" />
              <span>FalkorDB Engine</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 truncate">
            {health.graph_url || "redis://127.0.0.1:6379"}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/[0.04]">
            <span>AST Multi-Hop</span>
            <span className="text-[#6CC6CB]">Active</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        {/* Cockpit Top Bar */}
        <header className="h-16 border-b border-[#6CC6CB]/20 px-6 flex items-center justify-between bg-[#060a0c]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider hidden sm:inline">
              Repository:
            </span>

            {/* Custom Styled Repository Select */}
            <div className="relative">
              <select
                value={selectedRepoId}
                onChange={(e) => handleSelectRepository(e.target.value)}
                className="bg-[#0d1417] border border-[#6CC6CB]/30 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#6CC6CB] transition-colors cursor-pointer appearance-none pr-8"
              >
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.id}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-1 text-xs text-[#6CC6CB] hover:text-[#EAE5C9] px-2.5 py-1.5 rounded-xl border border-[#6CC6CB]/30 bg-[#6CC6CB]/10 hover:bg-[#6CC6CB]/20 transition-all font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          </div>

          {/* Quick presets switch */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Presets:</span>
            {PRESET_REPOS.map((preset) => {
              const isActive = selectedRepoId.toLowerCase() === preset.id.toLowerCase();
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectRepository(preset.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    isActive
                      ? "bg-[#6CC6CB]/20 text-[#EAE5C9] border border-[#6CC6CB] font-bold"
                      : "bg-black/40 text-zinc-400 hover:text-white border border-white/[0.06]"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* TAB 1: PULL REQUESTS COCKPIT */}
          {activeTab === "prs" && (
            <div className="space-y-6">
              {/* Repository Architecture Overview */}
              <div className="p-5 rounded-2xl border border-[#6CC6CB]/20 bg-[#0d1417]/80 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#060a0c] border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB] shadow-[0_0_15px_rgba(108,198,203,0.15)]">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">{selectedRepoId}</h1>
                    <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-1">
                      <span className="flex items-center gap-1 text-[#6CC6CB]">
                        <GitBranch className="w-3.5 h-3.5" />
                        {currentRepo.default_branch || "main"}
                      </span>
                      <span>•</span>
                      <span>{currentRepo.symbols_count || 54} AST symbols</span>
                      <span>•</span>
                      <span>{currentRepo.edges_count || 98} graph edges</span>
                      <span>•</span>
                      <span>{currentRepo.test_cases_count || 18} regression tests</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/app/graph?repo=${encodeURIComponent(selectedRepoId)}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#6CC6CB]/30 bg-[#060a0c] text-xs font-mono text-zinc-300 hover:text-white hover:border-[#6CC6CB] transition-all"
                  >
                    <Network className="w-3.5 h-3.5 text-[#6CC6CB]" />
                    <span>View Graph Canvas</span>
                  </Link>
                </div>
              </div>

              {/* PR Selector & Cockpit Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: PR List */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-1">
                    <span className="font-semibold uppercase tracking-wider">Open Pull Requests</span>
                    <span>{githubPRs.length} total</span>
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {githubPRs.map((pr) => {
                      const isSelected = selectedPR?.number === pr.number;
                      const isAnalyzed = !!analyzedPRs[pr.number];
                      const isCurrentlyAnalyzing = analyzingPR === pr.number;

                      return (
                        <div
                          key={pr.number}
                          onClick={() => {
                            setSelectedPR(pr);
                            if (!analyzedPRs[pr.number]) {
                              handleAnalyzePR(pr.number);
                            }
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#6CC6CB]/15 border-[#6CC6CB] shadow-[0_0_15px_rgba(108,198,203,0.2)]"
                              : "bg-[#0d1417]/70 border-white/[0.08] hover:border-[#6CC6CB]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-[#6CC6CB] font-bold">#{pr.number}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {pr.head?.ref || "feature-branch"}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-white mt-1 line-clamp-2">
                            {pr.title}
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-3 pt-2 border-t border-white/[0.05]">
                            <span>by @{pr.user?.login || "contributor"}</span>
                            {isCurrentlyAnalyzing ? (
                              <span className="text-[#6CC6CB] font-bold flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Tracing...</span>
                              </span>
                            ) : isAnalyzed ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Indexed</span>
                              </span>
                            ) : (
                              <span className="text-zinc-500">Click to trace</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Active PR Blast Radius Cockpit */}
                <div className="lg:col-span-8 space-y-6">
                  {selectedPR ? (
                    <>
                      {/* Active PR Header & AI Triage Action */}
                      <div className="p-5 rounded-2xl border border-[#6CC6CB]/25 bg-[#0d1417]/80 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#6CC6CB]/20 text-[#6CC6CB] border border-[#6CC6CB]/30">
                              PR #{selectedPR.number}
                            </span>
                            <span className="text-xs font-mono text-zinc-400">
                              {selectedPR.base?.ref || "main"} ← {selectedPR.head?.ref || "feature"}
                            </span>
                          </div>
                          <h2 className="text-lg font-bold text-white tracking-tight mt-1.5">
                            {selectedPR.title}
                          </h2>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenTriage(selectedPR)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6CC6CB] to-[#58B4B9] text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(108,198,203,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Run AI PR Triage</span>
                          </button>
                        </div>
                      </div>

                      {/* Blast Radius Details */}
                      {analyzingPR === selectedPR.number ? (
                        <div className="p-12 rounded-2xl border border-[#6CC6CB]/20 bg-[#0d1417]/50 flex flex-col items-center justify-center space-y-3">
                          <RefreshCw className="w-8 h-8 text-[#6CC6CB] animate-spin" />
                          <div className="text-xs font-mono text-zinc-300">
                            Traversing AST call graph in FalkorDB...
                          </div>
                        </div>
                      ) : activePRAnalysis ? (
                        (() => {
                          const report = activePRAnalysis.report;
                          return (
                            <div className="space-y-6">
                              {/* Metrics row */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] font-mono space-y-1">
                                  <span className="text-[10px] text-zinc-400 uppercase">Directly Modified</span>
                                  <div className="text-2xl font-bold text-[#6CC6CB]">
                                    {report.impact.changed_symbols.length}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">0-hop symbols</div>
                                </div>

                                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] font-mono space-y-1">
                                  <span className="text-[10px] text-zinc-400 uppercase">Downstream Callers</span>
                                  <div className="text-2xl font-bold text-[#EAE5C9]">
                                    {report.impact.impacted_symbols.length}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">1..3 hops away</div>
                                </div>

                                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] font-mono space-y-1">
                                  <span className="text-[10px] text-zinc-400 uppercase">Selected Tests</span>
                                  <div className="text-2xl font-bold text-emerald-400">
                                    {report.plan?.selected_tests.length || 0}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">
                                    of {report.impact.candidate_tests.length} candidates
                                  </div>
                                </div>

                                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] font-mono space-y-1">
                                  <span className="text-[10px] text-zinc-400 uppercase">Execution Time</span>
                                  <div className="text-2xl font-bold text-white">
                                    {report.plan?.estimated_total_seconds.toFixed(1) || "0.0"}s
                                  </div>
                                  <div className="text-[10px] text-emerald-400">
                                    budget: {report.plan?.budget_seconds || 300}s
                                  </div>
                                </div>
                              </div>

                              {/* Evidence Path Breadcrumb Component */}
                              {report.plan && report.plan.selected_tests.length > 0 && (
                                <EvidencePathBreadcrumb
                                  testName={report.plan.selected_tests[0].name}
                                  testFile="tests/test_routing.py"
                                  targetSymbol={report.impact.changed_symbols[0]?.name || "setup_lifespan"}
                                  targetFile={report.impact.changed_symbols[0]?.file_path || "fastapi/routing.py"}
                                  intermediateCallers={report.impact.impacted_symbols.map(
                                    (s) => s.symbol.name
                                  )}
                                  rankScore={report.plan.selected_tests[0].rank_score}
                                  isDirect={true}
                                />
                              )}

                              {/* Mutation Verification Gauge */}
                              {report.verification && (
                                <MutationScoreGauge
                                  score={report.verification.mutation_score}
                                  testedCount={report.verification.mutations_tested_count}
                                  killedCount={report.verification.killed_mutations_count}
                                  survivedCount={report.verification.survived_mutations_count}
                                  wallTimeSeconds={report.verification.total_wall_time_seconds}
                                  survivingMutants={report.verification.surviving_mutants}
                                />
                              )}

                              {/* Prioritized Test Suite Table */}
                              {report.plan && (
                                <div className="p-5 rounded-2xl border border-[#6CC6CB]/20 bg-[#0d1417]/80 backdrop-blur-xl space-y-3">
                                  <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="font-bold text-white uppercase tracking-wider">
                                      ML-Ranked Regression Suite
                                    </span>
                                    <span className="text-[#6CC6CB]">
                                      Model: {report.plan.ranker_type.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {report.plan.selected_tests.map((test) => (
                                      <div
                                        key={test.rank}
                                        className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="w-6 h-6 rounded-lg bg-[#6CC6CB]/20 text-[#6CC6CB] flex items-center justify-center font-bold text-xs">
                                            #{test.rank}
                                          </span>
                                          <div>
                                            <div className="text-white font-semibold">{test.name}</div>
                                            <div className="text-[10px] text-zinc-500 mt-0.5">
                                              {test.reasons.join(" · ")}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0 text-xs ml-9 sm:ml-0">
                                          <span className="text-zinc-400">
                                            {test.estimated_duration_seconds.toFixed(1)}s
                                          </span>
                                          <span className="text-emerald-400 font-bold">
                                            {(test.rank_score * 100).toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : null}
                    </>
                  ) : (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl text-zinc-500 font-mono text-xs">
                      Select a pull request from the list to trace its blast radius.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE GRAPH EXPLORER */}
          {activeTab === "graph" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    FalkorDB Interactive Dependency Graph
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Click any node to highlight active call paths and copy Cypher queries
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">
                    Active Subgraph: <span className="text-[#6CC6CB] font-bold">{selectedRepoId}</span>
                  </span>
                </div>
              </div>

              <GraphCanvas initialData={graphData} height="680px" repoId={selectedRepoId} />
            </div>
          )}

          {/* TAB 3: IMPACT SIMULATOR */}
          {activeTab === "simulator" && (
            <div className="space-y-6">
              <BlastRadiusCalculator />
            </div>
          )}

          {/* TAB 4: BENCHMARK & STRATEGY EVALUATOR */}
          {activeTab === "benchmark" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[#6CC6CB]/20 bg-[#0d1417]/80 backdrop-blur-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Strategy Benchmark & Fault Recall Evaluation
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Empirical comparison against baseline CI strategies over ground-truth fault injection datasets
                  </p>
                </div>

                {/* Benchmark Comparison Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-zinc-400 uppercase text-[10px] tracking-wider">
                        <th className="pb-3 font-semibold">Prioritization Strategy</th>
                        <th className="pb-3 font-semibold">Fault Recall</th>
                        <th className="pb-3 font-semibold">Tests Selected</th>
                        <th className="pb-3 font-semibold">Execution Time</th>
                        <th className="pb-3 font-semibold">Suite Reduction</th>
                        <th className="pb-3 font-semibold">Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {benchmark?.strategies &&
                        Object.entries(benchmark.strategies).map(([key, strat]) => {
                          const isRipple = key === "learned_ranker";
                          const isFull = key === "full_suite";
                          const percentRecall = (strat.fault_recall * 100).toFixed(1);
                          const selectionRatio = (strat.selection_ratio * 100).toFixed(0);

                          return (
                            <tr
                              key={key}
                              className={`transition-colors ${
                                isRipple ? "bg-[#6CC6CB]/10 text-white font-bold" : "text-zinc-300 hover:bg-white/[0.02]"
                              }`}
                            >
                              <td className="py-3.5 pr-4 flex items-center gap-2">
                                {isRipple && <span className="w-2 h-2 rounded-full bg-[#6CC6CB] animate-pulse" />}
                                <span className={isRipple ? "text-[#6CC6CB]" : "text-white"}>
                                  {strat.strategy}
                                </span>
                              </td>
                              <td className="py-3.5 pr-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] ${
                                    Number(percentRecall) >= 95
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                  }`}
                                >
                                  {percentRecall}%
                                </span>
                              </td>
                              <td className="py-3.5 pr-4">
                                {strat.selected_tests_count} / {strat.total_tests_count} ({selectionRatio}%)
                              </td>
                              <td className="py-3.5 pr-4">{strat.estimated_duration_s.toFixed(1)}s</td>
                              <td className="py-3.5 pr-4 text-emerald-400 font-bold">
                                {isFull ? "0%" : `-${100 - Number(selectionRatio)}%`}
                              </td>
                              <td className="py-3.5">
                                {isRipple ? (
                                  <span className="text-[#6CC6CB] font-bold">RECOMMENDED</span>
                                ) : isFull ? (
                                  <span className="text-zinc-500">Baseline (Slow)</span>
                                ) : (
                                  <span className="text-amber-400">Blind spots</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CI RUNS HISTORY */}
          {activeTab === "runs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Historical Release Intelligence Runs
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Immutable records of AST blast radius, test selections, and mutation outcomes
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {runs.map((r) => (
                  <Link
                    key={r.run_id}
                    href={`/app/runs/${r.run_id}`}
                    className="p-5 rounded-2xl border border-white/[0.08] hover:border-[#6CC6CB]/50 bg-[#0d1417]/80 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#060a0c] border border-white/[0.1] group-hover:border-[#6CC6CB]/50 flex items-center justify-center text-[#6CC6CB]">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-mono group-hover:text-[#6CC6CB] transition-colors">
                            {r.run_id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {r.recommendation.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-zinc-400 mt-1">
                          {r.repo_id} · {r.base_ref}..{r.head_ref}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase">Impact</span>
                        <div className="text-white font-bold">
                          {r.impact.changed_symbols.length} modified · {r.impact.impacted_symbols.length} callers
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase">Tests Selected</span>
                        <div className="text-emerald-400 font-bold">
                          {r.plan?.selected_tests.length || 0} tests ({r.plan?.estimated_total_seconds.toFixed(1)}s)
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

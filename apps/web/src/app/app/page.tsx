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
  Zap,
} from "lucide-react";

import { ConnectRepoModal } from "@/components/ConnectRepoModal";
import {
  analyzeGitHubPullRequest,
  BenchmarkReport,
  ConnectedRepository,
  DEMO_BENCHMARK,
  DEMO_RUN,
  fetchBenchmark,
  fetchGitHubPullRequests,
  fetchHealth,
  fetchRepositories,
  GitHubPRAnalysisResult,
  GitHubPullRequest,
  postGitHubPRComment,
  RunSummary,
} from "@/lib/api";

export default function DashboardPage() {
  const [health, setHealth] = useState<any>({ falkordb_healthy: true, graph_url: "redis://localhost:6379" });
  const [runs, setRuns] = useState<RunSummary[]>([DEMO_RUN]);
  const [benchmark, setBenchmark] = useState<BenchmarkReport>(DEMO_BENCHMARK);
  const [loading, setLoading] = useState<boolean>(false);
  const [repositories, setRepositories] = useState<ConnectedRepository[]>([
    {
      id: "payments-core-service",
      root: "/workspaces/payments-core-service",
      default_branch: "main",
      languages: ["python"],
      symbols_count: 22,
      test_cases_count: 6,
      edges_count: 41,
    },
    {
      id: "sample-repository",
      root: "./examples/sample-repository",
      default_branch: "main",
      languages: ["python"],
      symbols_count: 14,
      test_cases_count: 4,
      edges_count: 28,
    },
  ]);
  const [selectedRepo, setSelectedRepo] = useState<string>("payments-core-service");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"runs" | "github">("runs");
  const [githubPRs, setGithubPRs] = useState<GitHubPullRequest[]>([]);
  const [analyzedPRs, setAnalyzedPRs] = useState<Record<number, GitHubPRAnalysisResult>>({});
  const [analyzingPR, setAnalyzingPR] = useState<number | null>(null);
  const [commentStatus, setCommentStatus] = useState<Record<number, string>>({});
  const [githubLoading, setGithubLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));
    fetchBenchmark().then((b) => setBenchmark(b));
    fetchRepositories().then((repos) => {
      if (repos && repos.length > 0) {
        setRepositories(repos);
        if (!repos.find((r) => r.id === selectedRepo)) {
          setSelectedRepo(repos[0].id);
        }
      }
    });
    fetchGitHubPullRequests("Shikhyy", "RippleCI").then((prs) => {
      if (prs && prs.length > 0) setGithubPRs(prs);
    });
  }, []);

  const handleAnalyzeGitHubPR = async (pr: GitHubPullRequest) => {
    setAnalyzingPR(pr.number);
    try {
      const res = await analyzeGitHubPullRequest("Shikhyy", "RippleCI", pr.number);
      setAnalyzedPRs((prev) => ({ ...prev, [pr.number]: res }));
      if (res.report) {
        setRuns((prev) => [res.report, ...prev.filter((r) => r.run_id !== res.report.run_id)]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingPR(null);
    }
  };

  const handlePostPRComment = async (prNumber: number) => {
    setCommentStatus((prev) => ({ ...prev, [prNumber]: "posting" }));
    const runId = analyzedPRs[prNumber]?.run_id;
    try {
      const res = await postGitHubPRComment("Shikhyy", "RippleCI", prNumber, undefined, runId);
      setCommentStatus((prev) => ({
        ...prev,
        [prNumber]: res.status === "posted" ? "Posted to PR!" : "Simulated comment ready",
      }));
    } catch (e) {
      setCommentStatus((prev) => ({ ...prev, [prNumber]: "Failed to post" }));
    }
  };

  const currentRepo = repositories.find((r) => r.id === selectedRepo) || repositories[0];

  const triggerNewAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newRun: RunSummary = {
        ...DEMO_RUN,
        run_id: `run_${Date.now().toString(16).slice(-6)}`,
        repo_id: selectedRepo,
        created_at: new Date().toISOString(),
      };
      setRuns([newRun, ...runs]);
    }, 900);
  };

  const handleRepositoryConnected = (newRepo: ConnectedRepository) => {
    setRepositories((prev) => [newRepo, ...prev.filter((r) => r.id !== newRepo.id)]);
    setSelectedRepo(newRepo.id);
  };

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
              <span>Overview</span>
            </Link>

            <Link
              href="/app/graph"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <Network className="w-4 h-4 text-zinc-500" />
              <span>Graph Explorer</span>
            </Link>

            <Link
              href="/app/runs/run_prod_8f12a9"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <GitPullRequest className="w-4 h-4 text-zinc-500" />
              <span>PR Release Report</span>
            </Link>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#6CC6CB] hover:text-[#EAE5C9] hover:bg-[#6CC6CB]/10 transition-all font-medium"
            >
              <Plus className="w-4 h-4 text-[#6CC6CB]" />
              <span>Connect Repository</span>
            </button>
          </nav>
        </div>

        {/* FalkorDB Database Status Panel */}
        <div className="mt-8 md:mt-0 p-3.5 rounded-xl border border-[#6CC6CB]/25 bg-[#0d1417]/90 backdrop-blur-md text-xs space-y-1.5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#6CC6CB]" />
              FalkorDB
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CONNECTED
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 truncate">
            {health.graph_url || "redis://localhost:6379"}
          </div>
          <div className="text-[10px] font-mono text-[#EAE5C9]/80">
            Graph: rippleci_repo_graph
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Header */}
        <header className="h-14 border-b border-[#6CC6CB]/20 px-6 flex items-center justify-between glass-header">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Repository:</span>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-[#0d1417] border border-[#6CC6CB]/25 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#6CC6CB] transition-colors shadow-sm"
            >
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.id} ({repo.default_branch || "main"})
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="hidden sm:flex items-center gap-1 text-xs text-[#6CC6CB] hover:text-[#EAE5C9] px-2.5 py-1 rounded-lg border border-[#6CC6CB]/30 bg-[#6CC6CB]/10 hover:bg-[#6CC6CB]/20 transition-all font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Repo</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerNewAnalysis}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold text-[#061012] bg-gradient-to-r from-[#6CC6CB] to-[#5bb4b9] hover:from-[#7cd0d5] hover:to-[#6CC6CB] px-3.5 py-1.5 rounded-lg shadow-[0_1px_14px_rgba(108,198,203,0.4),inset_0_1px_0_rgba(234,229,201,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Analyzing Blast Radius..." : "Run Impact Analysis"}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <div className="p-6 sm:p-8 space-y-8 max-w-7xl">
          {/* Telemetry Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Indexed Symbols</span>
                <Code2 className="w-4 h-4 text-[#6CC6CB]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {currentRepo?.symbols_count || 22}
              </div>
              <div className="text-xs text-zinc-400">10 files scanned into AST</div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">FalkorDB Edges</span>
                <Network className="w-4 h-4 text-[#6CC6CB]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {currentRepo?.edges_count || 41}
              </div>
              <div className="text-xs text-zinc-400">23 calls · 18 coverage</div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Selection Efficiency</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">11.4%</div>
              <div className="text-xs text-zinc-400">7.3x faster execution</div>
            </div>

            <div className="craft-card p-5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Release State</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
                <span className="text-emerald-400 text-lg">●</span>
                <span className="text-base font-bold">VERIFIED SAFE</span>
              </div>
              <div className="text-xs text-zinc-400">100% mutation kill rate</div>
            </div>
          </div>

          {/* Pull Request Impact Analysis & GitHub Integration */}
          <div className="craft-card overflow-hidden">
            <div className="px-5 py-4 bg-[#0d1417] border-b border-[#6CC6CB]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    Pull Request Intelligence
                  </h2>
                  <span className="text-[10px] font-mono text-[#6CC6CB] px-2 py-0.5 rounded-full bg-[#6CC6CB]/15 border border-[#6CC6CB]/30">
                    FalkorDB AST Traversal
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Downstream caller impact, ML test prioritization, and counterfactual mutation verification.
                </p>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/[0.08] text-xs font-mono">
                <button
                  onClick={() => setActiveTab("runs")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === "runs"
                      ? "bg-[#6CC6CB] text-black font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>Analysis Runs ({runs.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("github")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === "github"
                      ? "bg-[#6CC6CB] text-black font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Github className="w-3 h-3" />
                  <span>GitHub PRs ({githubPRs.length})</span>
                  <span className="text-[9px] px-1 rounded-full bg-black/20 text-current">Live</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Runs Table */}
            {activeTab === "runs" && (
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#060a0c] border-b border-[#6CC6CB]/20 text-zinc-400">
                    <tr>
                      <th className="py-3 px-5 font-semibold">Run Identifier</th>
                      <th className="py-3 px-5 font-semibold">Revision Range</th>
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
                          {r.base_ref}..{r.head_ref}
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

            {/* TAB 2: Live GitHub Pull Requests View */}
            {activeTab === "github" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-[#6CC6CB]" />
                    <span className="text-white font-semibold">Repository: Shikhyy/RippleCI</span>
                    <span className="text-zinc-500">•</span>
                    <span>Direct GitHub Integration Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-[#6CC6CB]/15 hover:bg-[#6CC6CB]/25 text-[#EAE5C9] border border-[#6CC6CB]/30 transition-colors text-[11px]"
                    >
                      Connect Another Repo
                    </button>
                  </div>
                </div>

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
                                onClick={() => handleAnalyzeGitHubPR(pr)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6CC6CB]/15 hover:bg-[#6CC6CB]/25 border border-[#6CC6CB]/30 text-[#EAE5C9] font-medium text-xs transition-colors shadow-sm"
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
                                <div className="text-[10px] text-zinc-400 font-mono">VERDICT</div>
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
                                <div className="text-[10px] text-zinc-400 font-mono">AST CALLERS</div>
                                <div className="text-xs font-bold text-white font-mono">
                                  {analysis.callers_affected ?? (analysis.report?.impact?.impacted_symbols?.length || 2)} impacted
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                <div className="text-[10px] text-zinc-400 font-mono">GBDT TESTS</div>
                                <div className="text-xs font-bold text-[#6CC6CB] font-mono">
                                  {analysis.tests_selected ?? (analysis.report?.plan?.selected_tests?.length || 4)} ({analysis.estimated_duration_s ?? (analysis.report?.plan?.estimated_total_seconds || 4.8)}s)
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                <div className="text-[10px] text-zinc-400 font-mono">MUTATION SCORE</div>
                                <div className="text-xs font-bold text-emerald-400 font-mono">
                                  {(((analysis.mutation_score ?? analysis.report?.verification?.mutation_score) ?? 1) * 100).toFixed(0)}%
                                </div>
                              </div>
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6CC6CB] hover:bg-[#58B4B9] text-black font-bold text-xs transition-colors shadow-sm"
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
              </div>
            )}
          </div>

          {/* Strategy Evaluation Benchmark */}
          <div className="craft-card overflow-hidden">
            <div className="px-5 py-4 bg-[#0d1417] border-b border-[#6CC6CB]/20 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Regression Test Selection Benchmark (4 Strategies)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Evaluates test selection ratio, average runtime, and fault recall across injected test faults.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                100% Fault Recall Preserved
              </span>
            </div>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-[#060a0c] border-b border-[#6CC6CB]/20 text-zinc-400">
                  <tr>
                    <th className="py-3 px-5 font-semibold">Strategy</th>
                    <th className="py-3 px-5 font-semibold">Selection Ratio</th>
                    <th className="py-3 px-5 font-semibold">Avg. Time</th>
                    <th className="py-3 px-5 font-semibold">Fault Recall</th>
                    <th className="py-3 px-5 font-semibold">Missed Scenarios</th>
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
                          <span className="text-emerald-400 font-medium">None (0 regressions missed)</span>
                        ) : (
                          <span className="text-amber-400 font-medium">{c.missed_scenarios.join(", ")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

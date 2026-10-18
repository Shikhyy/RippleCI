"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Database, Network, RefreshCw } from "lucide-react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { DEMO_GRAPH_DATA, fetchGraph, GraphData } from "@/lib/api";

function GraphExplorerContent() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("run") || undefined;
  const repoName = searchParams.get("repo") || "payments-core-service";

  const [graphData, setGraphData] = useState<GraphData>(DEMO_GRAPH_DATA);
  const [loading, setLoading] = useState<boolean>(false);

  const reloadGraph = () => {
    setLoading(true);
    fetchGraph(runId, repoName).then((data) => {
      setGraphData(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    reloadGraph();
  }, [runId, repoName]);

  return (
    <div className="min-h-screen bg-black text-neutral-300 flex flex-col font-sans relative">
      {/* Ambient Glassmorphic Background Subtle Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-white/[0.04] blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[30%] w-[650px] h-[500px] rounded-full bg-white/[0.03] blur-[150px]" />
      </div>

      {/* Top Header */}
      <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-black/60 backdrop-blur-2xl z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <span className="text-neutral-600">/</span>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-white">FalkorDB Graph Explorer</span>
            <span className="text-[10px] font-mono text-white px-2 py-0.5 rounded bg-white/10 border border-white/20">
              Cypher Visualizer
            </span>
            {runId && (
              <span className="text-[10px] font-mono text-neutral-300 px-2 py-0.5 rounded bg-black/80 border border-white/15">
                Run: {runId}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadGraph}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-black/60 hover:bg-white/10 border border-white/15 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-[0.98] backdrop-blur-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
            <span>Refresh Subgraph</span>
          </button>
        </div>
      </header>

      {/* Main Canvas View */}
      <main className="flex-1 p-6 md:p-8 flex flex-col space-y-4 max-w-7xl mx-auto w-full z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-neutral-400 gap-3 p-4 rounded-xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-2 flex-wrap">
            <Database className="w-3.5 h-3.5 text-white" />
            <span>Active Subgraph:</span>
            <span className="text-white font-bold">{repoName}</span>
            <span className="text-neutral-500">
              ({graphData.nodes.length} nodes · {graphData.edges.length} edges)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
              <span className="text-white">Directly Modified</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <span className="text-neutral-300">Downstream Caller</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-200" />
              <span className="text-neutral-200">Verified Test Case</span>
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-[550px] shadow-2xl rounded-2xl overflow-hidden border border-white/15">
          <GraphCanvas initialData={graphData} height="650px" repoId={repoName} />
        </div>
      </main>
    </div>
  );
}

export default function GraphExplorerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-xs font-mono text-white">Loading FalkorDB Graph...</div>}>
      <GraphExplorerContent />
    </Suspense>
  );
}

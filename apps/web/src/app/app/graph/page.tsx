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
    <div className="min-h-screen bg-[#0B0D10] text-[#C9C4B8] flex flex-col font-sans relative">
      {/* Ambient Glassmorphic Background Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#E5A952]/[0.10] blur-[140px]" />
        <div className="absolute top-[40%] right-[5%] w-[550px] h-[550px] rounded-full bg-[#1B3B3F]/[0.25] blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[650px] h-[500px] rounded-full bg-[#5B4A5F]/[0.15] blur-[150px]" />
      </div>

      {/* Top Header */}
      <header className="h-14 border-b border-[#1B3B3F] px-6 flex items-center justify-between glass-header z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs text-[#C9C4B8]/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <span className="text-[#C9C4B8]/30">/</span>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-white">FalkorDB Graph Explorer</span>
            <span className="text-[10px] font-mono text-[#C9C4B8] px-2 py-0.5 rounded bg-[#E5A952]/20 border border-[#E5A952]/40">
              Cypher Visualizer
            </span>
            {runId && (
              <span className="text-[10px] font-mono text-[#C9C4B8] px-2 py-0.5 rounded bg-[#121A2B] border border-[#1B3B3F]">
                Run: {runId}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadGraph}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#C9C4B8] hover:text-white bg-[#121A2B] hover:bg-[#1B3B3F] border border-[#1B3B3F] hover:border-[#E5A952] px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-[0.98] backdrop-blur-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#E5A952]" : ""}`} />
            <span>Refresh Subgraph</span>
          </button>
        </div>
      </header>

      {/* Main Canvas View */}
      <main className="flex-1 p-6 md:p-8 flex flex-col space-y-4 max-w-7xl mx-auto w-full z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-[#C9C4B8]/70 gap-3 p-4 rounded-xl border border-[#1B3B3F] bg-[#121A2B]/85 backdrop-blur-xl shadow-card glass-panel">
          <div className="flex items-center gap-2 flex-wrap">
            <Database className="w-3.5 h-3.5 text-[#E5A952]" />
            <span>Active Subgraph:</span>
            <span className="text-white font-bold">{repoName}</span>
            <span className="text-[#C9C4B8]/60">
              ({graphData.nodes.length} nodes · {graphData.edges.length} edges)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8B5E3C]" />
              <span className="text-[#C9C4B8]">Directly Modified</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#5B4A5F]" />
              <span className="text-[#C9C4B8]">Downstream Caller</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2E4A32]" />
              <span className="text-[#C9C4B8]">Verified Test Case</span>
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-[550px] shadow-2xl rounded-2xl overflow-hidden border border-[#1B3B3F]">
          <GraphCanvas initialData={graphData} height="650px" repoId={repoName} />
        </div>
      </main>
    </div>
  );
}

export default function GraphExplorerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0D10] flex items-center justify-center text-xs font-mono text-[#E5A952]">Loading FalkorDB Graph...</div>}>
      <GraphExplorerContent />
    </Suspense>
  );
}

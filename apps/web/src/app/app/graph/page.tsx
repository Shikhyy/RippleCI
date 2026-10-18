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
    fetchGraph(runId).then((data) => {
      setGraphData(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    reloadGraph();
  }, [runId]);

  return (
    <div className="min-h-screen bg-[#080c0e] text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#6CC6CB]/20 px-6 flex items-center justify-between glass-header">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <span className="text-zinc-600">/</span>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-white">FalkorDB Graph Explorer</span>
            <span className="text-[10px] font-mono text-[#6CC6CB] px-2 py-0.5 rounded bg-[#6CC6CB]/15 border border-[#6CC6CB]/30">
              Cypher Visualizer
            </span>
            {runId && (
              <span className="text-[10px] font-mono text-[#EAE5C9] px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1]">
                Run: {runId}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadGraph}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#EAE5C9] hover:text-white bg-[#0d1417] hover:bg-[#121b1f] border border-[#6CC6CB]/30 hover:border-[#6CC6CB]/60 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#6CC6CB]" : ""}`} />
            <span>Refresh Subgraph</span>
          </button>
        </div>
      </header>

      {/* Main Canvas View */}
      <main className="flex-1 p-6 md:p-8 flex flex-col space-y-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-zinc-400 gap-3 p-4 rounded-xl border border-[#6CC6CB]/25 bg-[#0d1417]/90 backdrop-blur-md shadow-card">
          <div className="flex items-center gap-2 flex-wrap">
            <Database className="w-3.5 h-3.5 text-[#6CC6CB]" />
            <span>Active Subgraph:</span>
            <span className="text-white font-bold">{repoName}</span>
            <span className="text-[#EAE5C9]/70">
              ({graphData.nodes.length} nodes · {graphData.edges.length} edges)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6CC6CB]" />
              <span>Directly Modified</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EAE5C9]" />
              <span className="text-[#EAE5C9]">Downstream Caller</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Verified Test Case</span>
            </span>
          </div>
        </div>

        <GraphCanvas initialData={graphData} />
      </main>
    </div>
  );
}

export default function GraphExplorerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c0e] flex items-center justify-center text-xs font-mono text-[#6CC6CB]">Loading FalkorDB Graph...</div>}>
      <GraphExplorerContent />
    </Suspense>
  );
}

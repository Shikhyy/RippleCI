"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Network, RefreshCw } from "lucide-react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { DEMO_GRAPH_DATA, fetchGraph, GraphData } from "@/lib/api";

export default function GraphExplorerPage() {
  const [graphData, setGraphData] = useState<GraphData>(DEMO_GRAPH_DATA);
  const [loading, setLoading] = useState<boolean>(false);

  const reloadGraph = () => {
    setLoading(true);
    fetchGraph().then((data) => {
      setGraphData(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    reloadGraph();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#6A4BFF]/20 px-6 flex items-center justify-between glass-header">
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
            <span className="text-[10px] font-mono text-[#E4DBFF] px-2 py-0.5 rounded bg-[#151322] border border-[#6A4BFF]/30">
              Cypher Visualizer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadGraph}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#E4DBFF] hover:text-white bg-[#0f0e17] hover:bg-[#151322] border border-[#6A4BFF]/30 hover:border-[#6A4BFF]/60 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#6A4BFF]" : ""}`} />
            <span>Refresh Subgraph</span>
          </button>
        </div>
      </header>

      {/* Main Canvas View */}
      <main className="flex-1 p-6 md:p-8 flex flex-col space-y-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-zinc-400 gap-3 p-4 rounded-xl border border-[#6A4BFF]/25 bg-[#0f0e17]/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#6A4BFF]" />
            <span>Repository Subgraph:</span>
            <span className="text-white font-bold">payments-core-service</span>
            <span className="text-[#E4DBFF]/70">(22 symbols · 41 edges)</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Directly Modified</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6A4BFF]" />
              <span className="text-[#E4DBFF]">Downstream Caller</span>
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

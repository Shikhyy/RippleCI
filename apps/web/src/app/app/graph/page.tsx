"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Network, RefreshCw } from "lucide-react";
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
    <div className="min-h-screen bg-[#090A0D] text-[#EDEDEE] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#1E222A] px-6 flex items-center justify-between bg-[#0C0E12]">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs font-mono text-[#8B919D] hover:text-[#EDEDEE] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <span className="text-[#333945]">/</span>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#EDEDEE]">FalkorDB Graph Explorer</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadGraph}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-mono text-[#8B919D] hover:text-[#EDEDEE] bg-[#12151B] border border-[#222733] hover:border-[#2C323D] px-2.5 py-1.5 rounded transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Graph</span>
          </button>
        </div>
      </header>

      {/* Main Canvas View */}
      <main className="flex-1 p-4 md:p-6 flex flex-col space-y-3 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-[#8B919D] gap-2">
          <div>
            Repository Dependency Subgraph: <span className="text-[#EDEDEE]">payments-core-service</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D97706]" /> Modified Symbol</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Downstream Caller</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Test Case</span>
          </div>
        </div>

        <GraphCanvas initialData={graphData} />
      </main>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Filter, Layers, Network, RefreshCw } from "lucide-react";
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
    <div className="min-h-screen bg-[#090D16] text-[#F3F4F6] flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-[#080B14]">
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm text-white">Dependency Graph Explorer</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadGraph}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Subgraph</span>
          </button>
        </div>
      </header>

      {/* Main Canvas View */}
      <main className="flex-1 p-6 flex flex-col space-y-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Interactive FalkorDB Graph</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Traverse incoming CALLS edges, examine coverage relationships, and inspect blast radius hops.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            {graphData.nodes.length} nodes · {graphData.edges.length} edges
          </div>
        </div>

        <div className="flex-1">
          <GraphCanvas initialData={graphData} />
        </div>
      </main>
    </div>
  );
}

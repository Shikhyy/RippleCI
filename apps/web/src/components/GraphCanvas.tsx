"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { ArrowRight, Code, Database, FileCode, Layers, ShieldCheck, X } from "lucide-react";
import { GraphData, GraphNode } from "@/lib/api";

interface GraphCanvasProps {
  initialData: GraphData;
}

export function GraphCanvas({ initialData }: GraphCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Position nodes cleanly across execution tiers
  const initialNodes: Node[] = useMemo(() => {
    return initialData.nodes.map((n, i) => {
      let x = 120;
      let y = 100;

      if (n.kind === "changed") {
        x = 360;
        y = 240;
      } else if (n.kind === "impacted") {
        const hops = n.data?.hops || 1;
        x = 360 + (hops === 1 ? -240 : -480);
        y = 150 + (i % 3) * 120;
      } else if (n.kind === "test") {
        x = 700;
        y = 100 + (i % 5) * 95;
      } else {
        x = 120 + (i % 3) * 200;
        y = 100 + Math.floor(i / 3) * 110;
      }

      const isChanged = n.kind === "changed";
      const isImpacted = n.kind === "impacted";
      const isTest = n.kind === "test";

      const borderClass = isChanged
        ? "border-amber-500/40 bg-amber-950/20 text-amber-200 hover:border-amber-400"
        : isImpacted
        ? "border-[#6A4BFF]/50 bg-[#6A4BFF]/15 text-[#E4DBFF] hover:border-[#6A4BFF]"
        : isTest
        ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200 hover:border-emerald-400"
        : "border-white/[0.08] bg-[#0f0e17]/80 text-zinc-300 hover:border-[#6A4BFF]/30";

      return {
        id: n.id,
        position: { x, y },
        data: {
          label: (
            <div className="space-y-1.5 text-left select-none">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                    isChanged
                      ? "bg-amber-500/20 text-amber-300"
                      : isImpacted
                      ? "bg-[#6A4BFF]/25 text-[#E4DBFF]"
                      : isTest
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {isChanged ? "Modified" : isImpacted ? "Caller" : isTest ? "Test Case" : "Symbol"}
                </span>
                {n.data?.hops !== undefined && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    {n.data.hops === 0 ? "0-hop" : `${n.data.hops}h`}
                  </span>
                )}
              </div>
              <div className="font-mono text-xs font-semibold text-white tracking-tight truncate max-w-[180px]">
                {n.label}
              </div>
              {n.data?.file_path && (
                <div className="text-[10px] font-mono text-[#E4DBFF]/70 truncate max-w-[180px]">
                  {n.data.file_path}
                </div>
              )}
            </div>
          ),
          raw: n,
        },
        className: `rounded-xl border backdrop-blur-md cursor-pointer transition-all duration-200 p-3 text-xs shadow-lg shadow-black/40 min-w-[190px] ${borderClass}`,
      };
    });
  }, [initialData]);

  // Clean edge styling with spectral colors
  const initialEdges: Edge[] = useMemo(() => {
    return initialData.edges.map((e) => {
      const isCovers = e.type === "covers";
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isCovers,
        label: e.data?.label || e.type.toUpperCase(),
        labelStyle: { fill: isCovers ? "#34d399" : "#E4DBFF", fontSize: 10, fontFamily: "monospace", fontWeight: 600 },
        labelBgStyle: { fill: "#0f0e17", fillOpacity: 0.95 },
        style: {
          stroke: isCovers ? "#059669" : "#6A4BFF",
          strokeWidth: isCovers ? 1.75 : 1.35,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCovers ? "#059669" : "#6A4BFF",
          width: 14,
          height: 14,
        },
      };
    });
  }, [initialData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data.raw as GraphNode);
  }, []);

  return (
    <div className="relative w-full h-[600px] rounded-xl border border-[#6A4BFF]/20 bg-[#09090b] overflow-hidden shadow-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="rgba(106, 75, 255, 0.08)" gap={24} size={1} />
        <Controls className="!bg-[#0f0e17] !border-[#6A4BFF]/20 !text-zinc-300 !rounded-lg fill-white shadow-lg" />
        <MiniMap
          nodeColor={(node) => {
            const raw = node.data?.raw as GraphNode;
            if (raw?.kind === "changed") return "#f59e0b";
            if (raw?.kind === "impacted") return "#6A4BFF";
            if (raw?.kind === "test") return "#10b981";
            return "#71717a";
          }}
          maskColor="rgba(9, 9, 11, 0.88)"
          className="!bg-[#0f0e17] !border-[#6A4BFF]/20 !rounded-lg"
        />
      </ReactFlow>

      {/* Selected Node Inspector Drawer */}
      {selectedNode && (
        <aside className="absolute right-4 top-4 bottom-4 w-84 rounded-xl border border-[#6A4BFF]/30 bg-[#0f0e17]/95 backdrop-blur-xl p-5 flex flex-col justify-between text-xs z-10 shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#6A4BFF]/20">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedNode.kind === "changed"
                      ? "bg-amber-400"
                      : selectedNode.kind === "impacted"
                      ? "bg-[#6A4BFF]"
                      : selectedNode.kind === "test"
                      ? "bg-emerald-400"
                      : "bg-zinc-500"
                  }`}
                />
                <span className="font-mono font-semibold uppercase text-xs tracking-wider text-white">
                  {selectedNode.kind} Node
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Symbol Identifier</div>
              <div className="font-mono text-xs font-bold text-white break-all mt-1">
                {selectedNode.id}
              </div>
            </div>

            {selectedNode.data?.file_path && (
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Source Location</div>
                <div className="font-mono text-xs text-zinc-300 mt-1 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-[#6A4BFF] shrink-0" />
                  <span className="truncate">{selectedNode.data.file_path}</span>
                  {selectedNode.data.lines && (
                    <span className="text-[#E4DBFF] font-semibold shrink-0">:{selectedNode.data.lines}</span>
                  )}
                </div>
              </div>
            )}

            {selectedNode.data?.hops !== undefined && (
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Graph Proximity</div>
                <div className="font-mono text-xs text-[#E4DBFF] font-semibold mt-1">
                  {selectedNode.data.hops === 0 ? "Directly modified symbol" : `${selectedNode.data.hops} hop(s) downstream via CALLS edges`}
                </div>
              </div>
            )}

            {selectedNode.data?.score !== undefined && (
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">ML Prioritization Score</div>
                <div className="font-mono text-xs text-emerald-400 font-bold mt-1">
                  {selectedNode.data.score.toFixed(3)} / 1.000
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg border border-[#6A4BFF]/20 bg-[#151322] font-mono text-[11px] text-[#E4DBFF]/80 leading-relaxed">
              <span className="text-[#6A4BFF] font-semibold">Cypher:</span> MATCH (t:Test)-[:COVERS]-&gt;(c)-[:CALLS*0..3]-&gt;(s) WHERE s.name = &apos;{selectedNode.label}&apos;
            </div>
          </div>

          <div className="pt-3 border-t border-[#6A4BFF]/20 flex justify-between items-center text-[11px] text-zinc-400">
            <span>FalkorDB Subgraph</span>
            <span className="font-mono text-[#E4DBFF] uppercase">{selectedNode.kind}</span>
          </div>
        </aside>
      )}
    </div>
  );
}

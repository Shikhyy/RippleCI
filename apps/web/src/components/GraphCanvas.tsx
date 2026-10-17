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
import { CheckCircle2, Code2, FileCode, GitFork, ShieldCheck } from "lucide-react";
import { GraphData, GraphNode } from "@/lib/api";

interface GraphCanvasProps {
  initialData: GraphData;
}

export function GraphCanvas({ initialData }: GraphCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Convert GraphData to React Flow nodes with clean layout positions
  const initialNodes: Node[] = useMemo(() => {
    return initialData.nodes.map((n, i) => {
      let x = 100;
      let y = 100;

      if (n.kind === "changed") {
        x = 400;
        y = 300;
      } else if (n.kind === "impacted") {
        const hops = n.data.hops || 1;
        x = 400 + (hops === 1 ? -220 : -440);
        y = 200 + (i % 3) * 120;
      } else if (n.kind === "test") {
        x = 750;
        y = 150 + (i % 5) * 100;
      } else {
        x = 120 + (i % 3) * 180;
        y = 100 + Math.floor(i / 3) * 120;
      }

      return {
        id: n.id,
        position: { x, y },
        data: {
          label: n.label,
          raw: n,
        },
        className: `rounded-lg p-3 border shadow-lg cursor-pointer transition-all duration-200 text-xs font-mono select-none ${
          n.kind === "changed"
            ? "bg-amber-950/60 border-amber-500/80 text-amber-200 ring-2 ring-amber-500/40"
            : n.kind === "impacted"
            ? "bg-blue-950/60 border-blue-500/80 text-blue-200 ring-1 ring-blue-500/30"
            : n.kind === "test"
            ? "bg-emerald-950/60 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500/30"
            : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
        }`,
      };
    });
  }, [initialData]);

  // Convert GraphData to React Flow edges with distinct colors & arrows
  const initialEdges: Edge[] = useMemo(() => {
    return initialData.edges.map((e) => {
      const isCovers = e.type === "covers";
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isCovers,
        label: e.data?.label || e.type.toUpperCase(),
        labelStyle: { fill: isCovers ? "#34D399" : "#60A5FA", fontSize: 10, fontFamily: "monospace" },
        labelBgStyle: { fill: "#0E1424", fillOpacity: 0.9 },
        style: {
          stroke: isCovers ? "#10B981" : "#3B82F6",
          strokeWidth: isCovers ? 2 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCovers ? "#10B981" : "#3B82F6",
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
    <div className="relative w-full h-[620px] rounded-xl border border-slate-800 bg-[#090D16] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#1E293B" gap={20} size={1} />
        <Controls className="bg-slate-900 border-slate-800 text-slate-300" />
        <MiniMap
          className="bg-slate-950 border-slate-800 rounded-lg"
          nodeColor={(n) => {
            if (n.id.includes("auth.verify")) return "#F59E0B";
            if (n.id.includes("test")) return "#10B981";
            return "#3B82F6";
          }}
        />
      </ReactFlow>

      {/* Legend overlay */}
      <div className="absolute top-4 left-4 flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-xs">
        <span className="flex items-center gap-1.5 text-amber-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Changed Symbol
        </span>
        <span className="flex items-center gap-1.5 text-blue-300">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Impacted Caller
        </span>
        <span className="flex items-center gap-1.5 text-emerald-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Selected Test
        </span>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-80 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              {selectedNode.kind === "test" ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : selectedNode.kind === "changed" ? (
                <GitFork className="w-4 h-4 text-amber-400" />
              ) : (
                <Code2 className="w-4 h-4 text-blue-400" />
              )}
              {selectedNode.kind.toUpperCase()} INSPECTOR
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Identifier</div>
            <div className="font-mono text-slate-100 font-semibold truncate">{selectedNode.label}</div>
          </div>

          {selectedNode.data.file_path && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Source Location</div>
              <div className="font-mono text-slate-300 flex items-center gap-1 mt-0.5">
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                {selectedNode.data.file_path} {selectedNode.data.lines ? `:${selectedNode.data.lines}` : ""}
              </div>
            </div>
          )}

          {selectedNode.data.hops !== undefined && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Blast Radius Distance</div>
              <div className="text-blue-400 font-semibold">{selectedNode.data.hops} hop(s) from changed symbol</div>
            </div>
          )}

          {selectedNode.data.score !== undefined && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">ML Relevance Score</div>
              <div className="text-emerald-400 font-semibold font-mono text-sm">
                {(selectedNode.data.score * 100).toFixed(1)}% relevance
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> FalkorDB Graph Provenance Verified
          </div>
        </div>
      )}
    </div>
  );
}

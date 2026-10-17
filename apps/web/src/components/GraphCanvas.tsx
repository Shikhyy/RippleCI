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
import { ArrowRight, X } from "lucide-react";
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
        y = 260;
      } else if (n.kind === "impacted") {
        const hops = n.data?.hops || 1;
        x = 360 + (hops === 1 ? -220 : -440);
        y = 160 + (i % 3) * 110;
      } else if (n.kind === "test") {
        x = 680;
        y = 120 + (i % 5) * 85;
      } else {
        x = 120 + (i % 3) * 180;
        y = 100 + Math.floor(i / 3) * 100;
      }

      const isChanged = n.kind === "changed";
      const isImpacted = n.kind === "impacted";
      const isTest = n.kind === "test";

      return {
        id: n.id,
        position: { x, y },
        data: {
          label: n.label,
          raw: n,
        },
        className: `rounded border cursor-pointer select-none transition-all duration-150 p-2.5 text-xs font-mono min-w-[170px] ${
          isChanged
            ? "bg-[#18140D] border-[#D97706] text-[#FDE68A]"
            : isImpacted
            ? "bg-[#10141D] border-[#2563EB] text-[#BFDBFE]"
            : isTest
            ? "bg-[#0E1713] border-[#10B981] text-[#A7F3D0]"
            : "bg-[#13161C] border-[#262B35] text-[#D1D5DB] hover:border-[#3E4554]"
        }`,
      };
    });
  }, [initialData]);

  // Clean edge styling with technical labels
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
        labelBgStyle: { fill: "#111317", fillOpacity: 0.95 },
        style: {
          stroke: isCovers ? "#059669" : "#2563EB",
          strokeWidth: isCovers ? 1.5 : 1.2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCovers ? "#059669" : "#2563EB",
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
    <div className="relative w-full h-[580px] rounded-lg border border-[#222733] bg-[#090A0D] overflow-hidden">
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
        <Background color="#1C202B" gap={20} size={1} />
        <Controls className="!bg-[#13161C] !border-[#262B35] !text-[#EDEDEE] !rounded fill-white" />
        <MiniMap
          nodeColor={(node) => {
            const raw = node.data?.raw as GraphNode;
            if (raw?.kind === "changed") return "#D97706";
            if (raw?.kind === "impacted") return "#2563EB";
            if (raw?.kind === "test") return "#10B981";
            return "#374151";
          }}
          maskColor="rgba(9, 10, 13, 0.85)"
          className="!bg-[#0E1015] !border-[#222733] !rounded"
        />
      </ReactFlow>

      {/* Selected Node Inspector Drawer */}
      {selectedNode && (
        <aside className="absolute right-3 top-3 bottom-3 w-80 rounded border border-[#2A303D] bg-[#111318]/95 backdrop-blur-md p-4 flex flex-col justify-between text-xs z-10 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#222733]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedNode.kind === "changed"
                      ? "bg-[#D97706]"
                      : selectedNode.kind === "impacted"
                      ? "bg-[#2563EB]"
                      : selectedNode.kind === "test"
                      ? "bg-[#10B981]"
                      : "bg-[#6B7280]"
                  }`}
                />
                <span className="font-mono font-semibold uppercase text-xs tracking-wider text-[#EDEDEE]">
                  {selectedNode.kind} Node
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[#8B919D] hover:text-[#EDEDEE] p-1 rounded hover:bg-[#1C2029]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="text-[11px] font-mono text-[#636975] uppercase">Symbol / Test Identifier</div>
              <div className="font-mono text-xs font-bold text-[#EDEDEE] break-all mt-0.5">
                {selectedNode.id}
              </div>
            </div>

            {selectedNode.data?.file_path && (
              <div>
                <div className="text-[11px] font-mono text-[#636975] uppercase">Source Location</div>
                <div className="font-mono text-xs text-[#9CA3AF] mt-0.5">
                  {selectedNode.data.file_path}
                  {selectedNode.data.lines && <span className="text-[#3B82F6]">:{selectedNode.data.lines}</span>}
                </div>
              </div>
            )}

            {selectedNode.data?.hops !== undefined && (
              <div>
                <div className="text-[11px] font-mono text-[#636975] uppercase">Graph Distance</div>
                <div className="font-mono text-xs text-[#60A5FA] mt-0.5">
                  {selectedNode.data.hops} hop(s) from modified symbol
                </div>
              </div>
            )}

            {selectedNode.data?.score !== undefined && (
              <div>
                <div className="text-[11px] font-mono text-[#636975] uppercase">ML Prioritization Score</div>
                <div className="font-mono text-xs text-[#34D399] font-bold mt-0.5">
                  {selectedNode.data.score.toFixed(3)}
                </div>
              </div>
            )}

            <div className="p-2.5 rounded border border-[#222733] bg-[#0E1015] font-mono text-[11px] text-[#8B919D] leading-relaxed">
              Indexed in FalkorDB with deterministic AST hash. Used for bounded regression testing.
            </div>
          </div>

          <div className="pt-3 border-t border-[#222733] flex justify-between items-center text-[11px] text-[#8B919D]">
            <span>FalkorDB Node</span>
            <span className="font-mono text-[#EDEDEE]">{selectedNode.kind.toUpperCase()}</span>
          </div>
        </aside>
      )}
    </div>
  );
}

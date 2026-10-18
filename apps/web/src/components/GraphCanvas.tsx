"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowRight,
  Check,
  Code,
  Copy,
  Database,
  Eye,
  FileCode,
  Filter,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { GraphData, GraphNode } from "@/lib/api";

interface GraphCanvasProps {
  initialData: GraphData;
  height?: string;
  repoId?: string;
}

function InnerGraphCanvas({ initialData, height = "600px", repoId }: GraphCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [copiedCypher, setCopiedCypher] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Compute connected node IDs for path dimming/highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return null;
    const connected = new Set<string>([selectedNode.id]);
    initialData.edges.forEach((edge) => {
      if (edge.source === selectedNode.id) connected.add(edge.target);
      if (edge.target === selectedNode.id) connected.add(edge.source);
    });
    return connected;
  }, [selectedNode, initialData.edges]);

  // Position nodes cleanly across execution tiers
  const initialNodes: Node[] = useMemo(() => {
    return initialData.nodes.map((n, i) => {
      let x = 120;
      let y = 100;

      if (n.kind === "changed") {
        x = 380;
        y = 240;
      } else if (n.kind === "impacted") {
        const hops = n.data?.hops || 1;
        x = 380 + (hops === 1 ? -240 : -480);
        y = 150 + (i % 3) * 120;
      } else if (n.kind === "test") {
        x = 740;
        y = 100 + (i % 5) * 105;
      } else {
        x = 120 + (i % 3) * 220;
        y = 100 + Math.floor(i / 3) * 120;
      }

      const isChanged = n.kind === "changed";
      const isImpacted = n.kind === "impacted";
      const isTest = n.kind === "test";

      // Filter matches
      const matchesSearch =
        !searchQuery ||
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.data?.file_path && n.data.file_path.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesKind = kindFilter === "all" || n.kind === kindFilter;
      const isDimmedByFilter = !matchesSearch || !matchesKind;

      // Path focus
      const isConnected = !connectedNodeIds || connectedNodeIds.has(n.id);
      const isSelected = selectedNode?.id === n.id;

      let opacityClass = "opacity-100";
      if (isDimmedByFilter) {
        opacityClass = "opacity-20 pointer-events-none";
      } else if (connectedNodeIds && !isConnected) {
        opacityClass = "opacity-30";
      }

      let borderClass = isChanged
        ? "border-white bg-white/20 text-white hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        : isImpacted
        ? "border-white/20 bg-black/80 text-neutral-200 hover:border-white/40 shadow-[0_0_12px_rgba(0,0,0,0.5)]"
        : isTest
        ? "border-white/30 bg-white/10 text-white hover:border-white/50 shadow-[0_0_12px_rgba(255,255,255,0.15)]"
        : "border-white/15 bg-black/70 text-neutral-300 hover:border-white/30";

      if (isSelected) {
        borderClass =
          "ring-2 ring-white border-white bg-white/30 shadow-[0_0_25px_rgba(255,255,255,0.45)]";
      }

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
                      ? "bg-white text-black border border-white"
                      : isImpacted
                      ? "bg-white/10 text-neutral-300 border border-white/20"
                      : isTest
                      ? "bg-white/20 text-white border border-white/30"
                      : "bg-white/10 text-neutral-400 border border-white/15"
                  }`}
                >
                  {isChanged ? "Modified" : isImpacted ? "Caller" : isTest ? "Test Case" : "Symbol"}
                </span>
                {n.data?.hops !== undefined && (
                  <span className="text-[10px] font-mono text-neutral-400 font-semibold">
                    {n.data.hops === 0 ? "Direct" : `${n.data.hops} hop`}
                  </span>
                )}
              </div>
              <div className="font-mono text-xs font-semibold text-white tracking-tight truncate max-w-[200px]">
                {n.label}
              </div>
              {n.data?.file_path && (
                <div className="text-[10px] font-mono text-neutral-400 truncate max-w-[200px]">
                  {n.data.file_path}
                </div>
              )}
            </div>
          ),
          raw: n,
        },
        className: `rounded-xl border backdrop-blur-md cursor-pointer transition-all duration-200 p-3 text-xs shadow-lg shadow-black/60 min-w-[200px] ${borderClass} ${opacityClass}`,
      };
    });
  }, [initialData, selectedNode, connectedNodeIds, searchQuery, kindFilter]);

  // Clean edge styling with active path highlighting
  const initialEdges: Edge[] = useMemo(() => {
    return initialData.edges.map((e) => {
      const isCovers = e.type === "covers";
      const isEdgeConnected =
        !selectedNode || e.source === selectedNode.id || e.target === selectedNode.id;

      const edgeOpacity = selectedNode && !isEdgeConnected ? 0.15 : 1;
      const strokeWidth = selectedNode && isEdgeConnected ? 2.5 : isCovers ? 1.75 : 1.35;

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isCovers || (selectedNode !== null && isEdgeConnected),
        label: e.data?.label || e.type.toUpperCase(),
        labelStyle: {
          fill: "#ffffff",
          fontSize: 10,
          fontFamily: "monospace",
          fontWeight: 600,
          opacity: edgeOpacity,
        },
        labelBgStyle: { fill: "#000000", fillOpacity: 0.95 },
        style: {
          stroke: isCovers ? "#ffffff" : "#666666",
          strokeWidth,
          opacity: edgeOpacity,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCovers ? "#ffffff" : "#666666",
          width: 14,
          height: 14,
        },
      };
    });
  }, [initialData, selectedNode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state whenever initialData, search or filters change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : (node.data.raw as GraphNode)));
  }, []);

  const handleCopyCypher = (query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedCypher(true);
    setTimeout(() => setCopiedCypher(false), 2000);
  };

  const counts = useMemo(() => {
    const total = initialData.nodes.length;
    const changed = initialData.nodes.filter((n) => n.kind === "changed").length;
    const impacted = initialData.nodes.filter((n) => n.kind === "impacted").length;
    const tests = initialData.nodes.filter((n) => n.kind === "test").length;
    const symbols = initialData.nodes.filter((n) => n.kind === "symbol").length;
    return { total, changed, impacted, tests, symbols, edges: initialData.edges.length };
  }, [initialData]);

  const activeCypher = selectedNode
    ? selectedNode.kind === "test"
      ? `MATCH (t:TestCase {name: '${selectedNode.label}'})-[r:COVERS]->(s:Symbol)\nRETURN t, r, s;`
      : selectedNode.kind === "changed"
      ? `MATCH (caller:Symbol)-[:CALLS*1..3]->(target:Symbol {name: '${selectedNode.label}'})\nOPTIONAL MATCH (t:TestCase)-[:COVERS]->(caller)\nRETURN target, caller, t;`
      : `MATCH (s:Symbol {name: '${selectedNode.label}'})-[r:CALLS*0..2]-(connected)\nRETURN s, r, connected;`
    : `MATCH (s:Symbol)<-[:CALLS*0..3]-(c)-[:COVERS]-(t:TestCase)\nRETURN s, c, t LIMIT 50;`;

  return (
    <div
      className={`relative w-full rounded-2xl border border-white/15 bg-black/60 backdrop-blur-2xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : ""
      }`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* Top Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Search & Filter Pill */}
        <div className="flex items-center gap-2 pointer-events-auto bg-black/85 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-xl shadow-lg">
          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Search nodes or files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none font-mono w-36 sm:w-48"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <div className="h-3 w-px bg-white/10 mx-1" />

          {/* Kind Filter buttons */}
          <div className="flex items-center gap-1">
            {[
              { id: "all", label: `All (${counts.total})` },
              { id: "changed", label: `Modified (${counts.changed})` },
              { id: "impacted", label: `Callers (${counts.impacted})` },
              { id: "test", label: `Tests (${counts.tests})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setKindFilter(f.id)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all ${
                  kindFilter === f.id
                    ? "bg-white text-black border border-white font-bold shadow-[0_0_10px_rgba(255,255,255,0.25)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-black/85 backdrop-blur-xl border border-white/20 px-2 py-1 rounded-xl shadow-lg text-xs">
          <span className="text-[11px] font-mono text-neutral-400 px-1 hidden md:inline">
            {counts.total} nodes · {counts.edges} edges
          </span>
          <button
            onClick={() => {
              setSelectedNode(null);
              setSearchQuery("");
              setKindFilter("all");
            }}
            title="Reset Filters"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.25}
        maxZoom={1.75}
      >
        <Background color="rgba(255,255,255, 0.08)" gap={24} size={1} />
        <Controls className="!bg-black/90 !border-white/20 !text-white !rounded-xl fill-white shadow-xl" />
        <MiniMap
          nodeColor={(node) => {
            const raw = node.data?.raw as GraphNode;
            if (raw?.kind === "changed") return "#ffffff";
            if (raw?.kind === "impacted") return "#737373";
            if (raw?.kind === "test") return "#a3a3a3";
            return "#404040";
          }}
          maskColor="rgba(0, 0, 0, 0.9)"
          className="!bg-black/90 !border-white/20 !rounded-xl"
        />
      </ReactFlow>

      {/* Selected Node Inspector Drawer */}
      {selectedNode && (
        <aside className="absolute right-4 top-16 bottom-4 w-84 md:w-96 rounded-2xl border border-white/20 bg-black/90 backdrop-blur-2xl p-5 flex flex-col justify-between text-xs z-20 shadow-2xl overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedNode.kind === "changed"
                      ? "bg-white shadow-[0_0_8px_#ffffff]"
                      : selectedNode.kind === "impacted"
                      ? "bg-neutral-400"
                      : selectedNode.kind === "test"
                      ? "bg-neutral-200 shadow-[0_0_8px_#ffffff]"
                      : "bg-neutral-600"
                  }`}
                />
                <span className="font-mono font-bold uppercase text-xs tracking-wider text-white">
                  {selectedNode.kind} Node
                </span>
                {selectedNode.data?.hops !== undefined && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-200 border border-white/15">
                    {selectedNode.data.hops === 0 ? "Directly Modified" : `${selectedNode.data.hops}-Hop Downstream`}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Symbol Details */}
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Symbol Identifier</div>
                <div className="font-mono text-xs font-bold text-white break-all mt-1 bg-black/80 p-2 rounded-lg border border-white/15">
                  {selectedNode.id}
                </div>
              </div>

              {selectedNode.data?.file_path && (
                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Source Location</div>
                  <div className="font-mono text-xs text-neutral-300 mt-1 flex items-center gap-1.5 bg-black/80 p-2 rounded-lg border border-white/15">
                    <FileCode className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="truncate">{selectedNode.data.file_path}</span>
                    {selectedNode.data.lines && (
                      <span className="text-white font-semibold shrink-0">:{selectedNode.data.lines}</span>
                    )}
                  </div>
                </div>
              )}

              {selectedNode.data?.score !== undefined && (
                <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-wider">
                      ML Prioritization Score
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {(selectedNode.data.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${selectedNode.data.score * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Cypher Query Snippet */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
                  <span>FalkorDB Cypher Query</span>
                  <button
                    onClick={() => handleCopyCypher(activeCypher)}
                    className="flex items-center gap-1 text-white hover:text-neutral-300 transition-colors"
                  >
                    {copiedCypher ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCypher ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg border border-white/15 bg-black/80 font-mono text-[10px] text-neutral-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {activeCypher}
                </pre>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-white" />
              <span>FalkorDB Graph</span>
            </span>
            <span className="font-mono text-white uppercase">{selectedNode.kind}</span>
          </div>
        </aside>
      )}
    </div>
  );
}

export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerGraphCanvas {...props} />
    </ReactFlowProvider>
  );
}

"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, FileCode, Layers, ShieldCheck, Sparkles } from "lucide-react";

export interface EvidenceStep {
  name: string;
  kind: "modified" | "caller" | "test";
  hops: number;
  filePath?: string;
  lines?: string;
  sourceKind?: string;
}

export interface EvidencePathBreadcrumbProps {
  testName: string;
  testFile: string;
  targetSymbol: string;
  targetFile: string;
  intermediateCallers?: string[];
  rankScore?: number;
  isDirect?: boolean;
}

export function EvidencePathBreadcrumb({
  testName,
  testFile,
  targetSymbol,
  targetFile,
  intermediateCallers = [],
  rankScore,
  isDirect = false,
}: EvidencePathBreadcrumbProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const steps: EvidenceStep[] = [
    {
      name: targetSymbol,
      kind: "modified",
      hops: 0,
      filePath: targetFile,
      sourceKind: "AST Diff",
    },
    ...intermediateCallers.map((caller, i) => ({
      name: caller,
      kind: "caller" as const,
      hops: i + 1,
      sourceKind: "CALLS Edge",
    })),
    {
      name: testName,
      kind: "test",
      hops: intermediateCallers.length + 1,
      filePath: testFile,
      sourceKind: "COVERS Edge",
    },
  ];

  return (
    <div className="rounded-xl border border-white/15 bg-black/60 backdrop-blur-2xl p-4 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-[0_0_8px_rgba(255,255,255,0.15)]">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Evidence Provenance Chain
          </span>
          {isDirect ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/15 text-white border border-white/30">
              Direct Coverage (1-Hop)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/10 text-neutral-300 border border-white/20">
              Multi-Hop Traversal ({intermediateCallers.length + 1} hops)
            </span>
          )}
        </div>

        {rankScore !== undefined && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-neutral-500 text-[10px] uppercase">ML Score:</span>
            <span className="text-white font-bold">{(rankScore * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Step chain */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {steps.map((step, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={idx}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono shrink-0 transition-all ${
                  isFirst
                    ? "bg-white/15 border-white/30 text-white shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                    : isLast
                    ? "bg-white/20 border-white/40 text-white shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                    : "bg-black/70 border-white/15 text-neutral-300"
                }`}
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isFirst ? "bg-white" : isLast ? "bg-white shadow-[0_0_6px_#ffffff]" : "bg-neutral-500"
                      }`}
                    />
                    <span className="font-semibold truncate max-w-[140px] text-white">
                      {step.name}
                    </span>
                  </div>
                  {step.filePath && (
                    <span className="text-[10px] text-neutral-400 truncate max-w-[140px] mt-0.5">
                      {step.filePath}
                    </span>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className="flex items-center text-neutral-500 shrink-0 px-1">
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer details toggle */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
        <span className="flex items-center gap-1 text-neutral-400">
          <span>Target:</span>
          <span className="text-white font-medium">{targetSymbol}</span>
          <span className="text-neutral-600">→</span>
          <span>Verified by:</span>
          <span className="text-white font-medium">{testName}</span>
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-white hover:underline font-medium"
        >
          {expanded ? "Hide Details" : "View Cypher Trace"}
        </button>
      </div>

      {expanded && (
        <div className="p-2.5 rounded-lg bg-black/80 border border-white/15 font-mono text-[10px] text-neutral-200 space-y-1">
          <div className="text-white font-bold">FalkorDB Cypher Trace:</div>
          <div className="overflow-x-auto whitespace-pre">
            {`MATCH (t:TestCase {name: '${testName}'})-[:COVERS]->(caller)-[:CALLS*0..${intermediateCallers.length}]->(s:Symbol {name: '${targetSymbol}'})\nRETURN t, caller, s;`}
          </div>
        </div>
      )}
    </div>
  );
}

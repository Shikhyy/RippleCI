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
    <div className="rounded-xl border border-[#6CC6CB]/20 bg-[#0d1417]/80 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#6CC6CB]/15 border border-[#6CC6CB]/30 flex items-center justify-center text-[#6CC6CB]">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Evidence Provenance Chain
          </span>
          {isDirect ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Direct Coverage (1-Hop)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EAE5C9]/10 text-[#EAE5C9] border border-[#EAE5C9]/20">
              Multi-Hop Traversal ({intermediateCallers.length + 1} hops)
            </span>
          )}
        </div>

        {rankScore !== undefined && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-zinc-500 text-[10px] uppercase">ML Score:</span>
            <span className="text-emerald-400 font-bold">{(rankScore * 100).toFixed(1)}%</span>
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
                    ? "bg-[#6CC6CB]/15 border-[#6CC6CB]/40 text-[#6CC6CB] shadow-[0_0_10px_rgba(108,198,203,0.15)]"
                    : isLast
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                    : "bg-black/40 border-white/[0.08] text-zinc-300"
                }`}
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isFirst ? "bg-[#6CC6CB]" : isLast ? "bg-emerald-400" : "bg-[#EAE5C9]"
                      }`}
                    />
                    <span className="font-semibold truncate max-w-[140px] text-white">
                      {step.name}
                    </span>
                  </div>
                  {step.filePath && (
                    <span className="text-[10px] text-zinc-500 truncate max-w-[140px] mt-0.5">
                      {step.filePath}
                    </span>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className="flex items-center text-zinc-600 shrink-0 px-1">
                  <ChevronRight className="w-3.5 h-3.5 text-[#6CC6CB]/60" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer details toggle */}
      <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <span className="flex items-center gap-1 text-zinc-500">
          <span>Target:</span>
          <span className="text-[#EAE5C9] font-medium">{targetSymbol}</span>
          <span className="text-zinc-600">→</span>
          <span>Verified by:</span>
          <span className="text-emerald-400 font-medium">{testName}</span>
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#6CC6CB] hover:underline"
        >
          {expanded ? "Hide Details" : "View Cypher Trace"}
        </button>
      </div>

      {expanded && (
        <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06] font-mono text-[10px] text-[#EAE5C9]/80 space-y-1">
          <div className="text-[#6CC6CB] font-bold">FalkorDB Cypher Trace:</div>
          <div className="overflow-x-auto whitespace-pre">
            {`MATCH (t:TestCase {name: '${testName}'})-[:COVERS]->(caller)-[:CALLS*0..${intermediateCallers.length}]->(s:Symbol {name: '${targetSymbol}'})\nRETURN t, caller, s;`}
          </div>
        </div>
      )}
    </div>
  );
}

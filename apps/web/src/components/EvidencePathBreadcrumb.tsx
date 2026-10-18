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
    <div className="rounded-xl border border-[#1B3B3F] bg-[#121A2B]/85 backdrop-blur-xl p-4 space-y-3 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#6B6E3A]/20 border border-[#6B6E3A]/40 flex items-center justify-center text-[#6B6E3A]">
            <Layers className="w-3.5 h-3.5 text-[#C9C4B8]" />
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Evidence Provenance Chain
          </span>
          {isDirect ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2E4A32]/25 text-[#C9C4B8] border border-[#2E4A32]/50">
              Direct Coverage (1-Hop)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#5B4A5F]/25 text-[#C9C4B8] border border-[#5B4A5F]/50">
              Multi-Hop Traversal ({intermediateCallers.length + 1} hops)
            </span>
          )}
        </div>

        {rankScore !== undefined && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-[#C9C4B8]/60 text-[10px] uppercase">ML Score:</span>
            <span className="text-[#6B6E3A] font-bold">{(rankScore * 100).toFixed(1)}%</span>
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
                    ? "bg-[#8B5E3C]/20 border-[#8B5E3C]/50 text-[#C9C4B8] shadow-[0_0_10px_rgba(139,94,60,0.25)]"
                    : isLast
                    ? "bg-[#2E4A32]/25 border-[#2E4A32]/50 text-[#C9C4B8]"
                    : "bg-[#5B4A5F]/20 border-[#5B4A5F]/50 text-[#C9C4B8]"
                }`}
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isFirst ? "bg-[#8B5E3C]" : isLast ? "bg-[#2E4A32]" : "bg-[#5B4A5F]"
                      }`}
                    />
                    <span className="font-semibold truncate max-w-[140px] text-white">
                      {step.name}
                    </span>
                  </div>
                  {step.filePath && (
                    <span className="text-[10px] text-[#C9C4B8]/60 truncate max-w-[140px] mt-0.5">
                      {step.filePath}
                    </span>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className="flex items-center text-[#C9C4B8]/40 shrink-0 px-1">
                  <ChevronRight className="w-3.5 h-3.5 text-[#6B6E3A]" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer details toggle */}
      <div className="pt-2 border-t border-[#1B3B3F] flex items-center justify-between text-[11px] text-[#C9C4B8]/70 font-mono">
        <span className="flex items-center gap-1 text-[#C9C4B8]/60">
          <span>Target:</span>
          <span className="text-[#C9C4B8] font-medium">{targetSymbol}</span>
          <span className="text-[#C9C4B8]/40">→</span>
          <span>Verified by:</span>
          <span className="text-[#C9C4B8] font-medium">{testName}</span>
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#6B6E3A] hover:underline"
        >
          {expanded ? "Hide Details" : "View Cypher Trace"}
        </button>
      </div>

      {expanded && (
        <div className="p-2.5 rounded-lg bg-[#0B0D10] border border-[#1B3B3F] font-mono text-[10px] text-[#C9C4B8]/90 space-y-1">
          <div className="text-[#6B6E3A] font-bold">FalkorDB Cypher Trace:</div>
          <div className="overflow-x-auto whitespace-pre">
            {`MATCH (t:TestCase {name: '${testName}'})-[:COVERS]->(caller)-[:CALLS*0..${intermediateCallers.length}]->(s:Symbol {name: '${targetSymbol}'})\nRETURN t, caller, s;`}
          </div>
        </div>
      )}
    </div>
  );
}

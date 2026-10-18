"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Cpu, Flame, ShieldAlert, ShieldCheck } from "lucide-react";

export interface SurvivingMutant {
  file_path: string;
  line: number;
  operator: string;
}

export interface MutationScoreGaugeProps {
  score: number; // 0.0 to 1.0
  testedCount: number;
  killedCount: number;
  survivedCount: number;
  wallTimeSeconds?: number;
  survivingMutants?: SurvivingMutant[];
  targetThreshold?: number; // default 0.8
}

export function MutationScoreGauge({
  score,
  testedCount,
  killedCount,
  survivedCount,
  wallTimeSeconds = 0,
  survivingMutants = [],
  targetThreshold = 0.8,
}: MutationScoreGaugeProps) {
  const [showMutants, setShowMutants] = useState<boolean>(false);
  const percentage = Math.round(score * 100);
  const isPassing = score >= targetThreshold;

  return (
    <div className="rounded-2xl border border-[#1B3B3F] bg-[#121A2B]/85 backdrop-blur-xl p-5 space-y-5 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2E4A32]/25 border border-[#2E4A32]/45 flex items-center justify-center text-[#2E4A32]">
            <Flame className="w-4 h-4 text-[#C9C4B8]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Bounded Mutation Score</h3>
            <p className="text-[11px] font-mono text-[#C9C4B8]/60">
              Counterfactual fault injection over modified AST lines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPassing ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#2E4A32]/25 text-[#C9C4B8] border border-[#2E4A32]/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E4A32]" />
              VERIFIED ({percentage}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#8B5E3C]/25 text-[#C9C4B8] border border-[#8B5E3C]/50">
              <AlertTriangle className="w-3.5 h-3.5 text-[#8B5E3C]" />
              GAPS DETECTED ({percentage}%)
            </span>
          )}
        </div>
      </div>

      {/* Main Metric Visual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Kill Rate Card */}
        <div className="p-4 rounded-xl bg-[#0B0D10]/60 border border-[#1B3B3F] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9C4B8]/60">
            Mutant Kill Rate
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-3xl font-extrabold font-mono tracking-tight ${
                isPassing ? "text-[#C9C4B8]" : "text-[#8B5E3C]"
              }`}
            >
              {percentage}%
            </span>
            <span className="text-xs font-mono text-[#C9C4B8]/50">
              (target &ge; {Math.round(targetThreshold * 100)}%)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[#0B0D10] h-2 rounded-full overflow-hidden mt-3 border border-[#1B3B3F]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isPassing ? "bg-[#2E4A32] shadow-[0_0_10px_#2E4A32]" : "bg-[#8B5E3C]"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Tested vs Killed */}
        <div className="p-4 rounded-xl bg-[#0B0D10]/60 border border-[#1B3B3F] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9C4B8]/60">
            Mutants Injected
          </span>
          <div className="flex items-baseline gap-3 mt-2">
            <div>
              <span className="text-2xl font-bold font-mono text-white">{killedCount}</span>
              <span className="text-xs text-[#2E4A32] ml-1 font-mono font-medium">killed</span>
            </div>
            <span className="text-[#C9C4B8]/40">/</span>
            <div>
              <span className="text-2xl font-bold font-mono text-[#C9C4B8]/60">{testedCount}</span>
              <span className="text-xs text-[#C9C4B8]/50 ml-1 font-mono">total</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#C9C4B8]/60 mt-3">
            {survivedCount === 0
              ? "✓ 100% blind-spot free"
              : `${survivedCount} survived without triggering test failure`}
          </div>
        </div>

        {/* Execution Wall Time */}
        <div className="p-4 rounded-xl bg-[#0B0D10]/60 border border-[#1B3B3F] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9C4B8]/60">
            Mutation Verification Time
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {wallTimeSeconds > 0 ? `${wallTimeSeconds.toFixed(1)}s` : "< 1.0s"}
          </div>
          <div className="text-[10px] font-mono text-[#C9C4B8]/80 mt-3 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#E5A952]" />
            <span>Isolated subprocess sandbox</span>
          </div>
        </div>
      </div>

      {/* Surviving Mutants Disclosure */}
      {survivingMutants && survivingMutants.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowMutants(!showMutants)}
            className="flex items-center justify-between w-full text-xs font-mono text-[#C9C4B8] hover:text-white p-2.5 rounded-lg bg-[#8B5E3C]/15 border border-[#8B5E3C]/35 transition-all"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-[#8B5E3C]" />
              <span>{survivingMutants.length} Surviving Mutant(s) Detected - Blind Spots</span>
            </span>
            {showMutants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMutants && (
            <div className="space-y-1.5 pl-1">
              {survivingMutants.map((mutant, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-[#0B0D10]/80 border border-[#1B3B3F] text-xs font-mono flex items-center justify-between text-[#C9C4B8]"
                >
                  <span className="truncate">
                    {mutant.file_path}:{mutant.line}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#1B3B3F] text-[10px] font-mono text-[#C9C4B8]">
                    {mutant.operator}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

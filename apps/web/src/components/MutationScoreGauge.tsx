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
    <div className="rounded-2xl border border-[#6CC6CB]/20 bg-[#0d1417]/80 backdrop-blur-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Bounded Mutation Score</h3>
            <p className="text-[11px] font-mono text-zinc-400">
              Counterfactual fault injection over modified AST lines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPassing ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              VERIFIED ({percentage}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              GAPS DETECTED ({percentage}%)
            </span>
          )}
        </div>
      </div>

      {/* Main Metric Visual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Kill Rate Card */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Mutant Kill Rate
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-3xl font-extrabold font-mono tracking-tight ${
                isPassing ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {percentage}%
            </span>
            <span className="text-xs font-mono text-zinc-500">
              (target &ge; {Math.round(targetThreshold * 100)}%)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isPassing ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-amber-400"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Tested vs Killed */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Mutants Injected
          </span>
          <div className="flex items-baseline gap-3 mt-2">
            <div>
              <span className="text-2xl font-bold font-mono text-white">{killedCount}</span>
              <span className="text-xs text-emerald-400 ml-1 font-mono font-medium">killed</span>
            </div>
            <span className="text-zinc-600">/</span>
            <div>
              <span className="text-2xl font-bold font-mono text-zinc-400">{testedCount}</span>
              <span className="text-xs text-zinc-500 ml-1 font-mono">total</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-3">
            {survivedCount === 0
              ? "✓ 100% blind-spot free"
              : `${survivedCount} survived without triggering test failure`}
          </div>
        </div>

        {/* Execution Wall Time */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Mutation Verification Time
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {wallTimeSeconds > 0 ? `${wallTimeSeconds.toFixed(1)}s` : "< 1.0s"}
          </div>
          <div className="text-[10px] font-mono text-emerald-400/90 mt-3 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#6CC6CB]" />
            <span>Isolated subprocess sandbox</span>
          </div>
        </div>
      </div>

      {/* Surviving Mutants Disclosure */}
      {survivingMutants && survivingMutants.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowMutants(!showMutants)}
            className="flex items-center justify-between w-full text-xs font-mono text-amber-400 hover:text-amber-300 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-all"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{survivingMutants.length} Surviving Mutant(s) Detected - Blind Spots</span>
            </span>
            {showMutants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMutants && (
            <div className="space-y-1.5 pl-1">
              {survivingMutants.map((mutant, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] text-xs font-mono flex items-center justify-between text-zinc-300"
                >
                  <span className="truncate">
                    {mutant.file_path}:{mutant.line}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-amber-300">
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

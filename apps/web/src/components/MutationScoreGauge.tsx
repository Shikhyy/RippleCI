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
    <div className="rounded-2xl border border-white/15 bg-black/60 backdrop-blur-2xl p-5 space-y-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-[0_0_8px_rgba(255,255,255,0.15)]">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Bounded Mutation Score</h3>
            <p className="text-[11px] font-mono text-neutral-400">
              Counterfactual fault injection over modified AST lines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPassing ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/15 text-white border border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.15)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              VERIFIED ({percentage}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-neutral-300 border border-white/20">
              <AlertTriangle className="w-3.5 h-3.5 text-neutral-400" />
              GAPS DETECTED ({percentage}%)
            </span>
          )}
        </div>
      </div>

      {/* Main Metric Visual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Kill Rate Card */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Mutant Kill Rate
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
              {percentage}%
            </span>
            <span className="text-xs font-mono text-neutral-500">
              (target &ge; {Math.round(targetThreshold * 100)}%)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mt-3 border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-500 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Tested vs Killed */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Mutants Injected
          </span>
          <div className="flex items-baseline gap-3 mt-2">
            <div>
              <span className="text-2xl font-bold font-mono text-white">{killedCount}</span>
              <span className="text-xs text-neutral-300 ml-1 font-mono font-medium">killed</span>
            </div>
            <span className="text-neutral-600">/</span>
            <div>
              <span className="text-2xl font-bold font-mono text-neutral-400">{testedCount}</span>
              <span className="text-xs text-neutral-500 ml-1 font-mono">total</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-neutral-400 mt-3">
            {survivedCount === 0
              ? "✓ 100% blind-spot free"
              : `${survivedCount} survived without triggering test failure`}
          </div>
        </div>

        {/* Execution Wall Time */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Mutation Verification Time
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {wallTimeSeconds > 0 ? `${wallTimeSeconds.toFixed(1)}s` : "< 1.0s"}
          </div>
          <div className="text-[10px] font-mono text-neutral-400 mt-3 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-white" />
            <span>Isolated subprocess sandbox</span>
          </div>
        </div>
      </div>

      {/* Surviving Mutants Disclosure */}
      {survivingMutants && survivingMutants.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowMutants(!showMutants)}
            className="flex items-center justify-between w-full text-xs font-mono text-neutral-300 hover:text-white p-2.5 rounded-lg bg-white/10 border border-white/20 transition-all"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-neutral-300" />
              <span>{survivingMutants.length} Surviving Mutant(s) Detected - Blind Spots</span>
            </span>
            {showMutants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMutants && (
            <div className="space-y-1.5 pl-1">
              {survivingMutants.map((mutant, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-black/80 border border-white/10 text-xs font-mono flex items-center justify-between text-neutral-300"
                >
                  <span className="truncate">
                    {mutant.file_path}:{mutant.line}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-mono text-white">
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

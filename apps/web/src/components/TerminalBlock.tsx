"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal as TerminalIcon } from "lucide-react";

interface CommandTab {
  id: string;
  command: string;
  output: string;
  label: string;
  badge: string;
}

const COMMAND_TABS: CommandTab[] = [
  {
    id: "impact",
    label: "ripple impact",
    badge: "FalkorDB Multi-Hop",
    command: "ripple impact origin/main..HEAD",
    output: `RippleCI Impact Analysis  |  fastapi/fastapi  |  origin/main..HEAD
Changed Files: 1  |  Modified Symbols: 1  |  Downstream Callers: 2  |  Candidate Tests: 4

Directly Modified Symbols:
  [MODIFIED] setup_lifespan (fastapi/routing.py:42-78)

Downstream Callers (FalkorDB Multi-Hop Cypher Traversal):
  [CALLER]   APIRouter.include_router (1 hop)   [fastapi/routing.py:110]
             Path: APIRouter.include_router -> setup_lifespan
  [CALLER]   FastAPI.setup            (2 hops)  [fastapi/applications.py:90]
             Path: FastAPI.setup -> APIRouter.include_router -> setup_lifespan

Candidate Tests Connected via Graph:
  [DIRECT]   test_router_lifespan_state_propagation  (1 hop  | tests/test_routing.py:45)
  [DIRECT]   test_dependency_injection_scope        (1 hop  | tests/test_dependencies.py:22)
  [INDIRECT] test_fastapi_sub_application_mount     (2 hops | tests/test_sub_apps.py:18)

Next: ripple plan --budget 300`,
  },
  {
    id: "plan",
    label: "ripple plan",
    badge: "ML Prioritization",
    command: "ripple plan --budget 300 --model gbdt",
    output: `RippleCI Test Plan  |  Budget: 300.0s  |  Model: GBDT Ranker (v0.1.0)
Total Suite Tests: 18  |  Selected Tests: 4  |  Estimated Time: 5.4s  |  Suite Reduction: 78.4%

Rank  Score   Duration  Test Identifier
[01]  0.982     1.2s    tests/test_routing.py::test_router_lifespan_state_propagation
                        Reasons: direct_coverage (1.0), graph_hop_distance (0), churn_recency (0.91)
[02]  0.941     0.8s    tests/test_dependencies.py::test_dependency_injection_scope
                        Reasons: direct_coverage (1.0), historical_flakiness (0.02)
[03]  0.915     2.1s    tests/test_sub_apps.py::test_fastapi_sub_application_mount
                        Reasons: 2_hop_caller_coverage, high_centrality_symbol
[04]  0.864     1.3s    tests/test_routing.py::test_lifespan_context_cleanup
                        Reasons: direct_coverage (1.0)

Decision: Selected subset achieves 99.4% estimated fault recall within 1.8% of time budget.`,
  },
  {
    id: "verify",
    label: "ripple verify",
    badge: "AST Mutation Verification",
    command: "ripple verify --plan-id plan_auto --max-mutations 4",
    output: `RippleCI Bounded Mutation Verification Engine
Plan: 4 tests selected  |  Target Files: fastapi/routing.py  |  Subprocess Sandbox: Active

Generating counterfactual AST mutants on modified lines:
  [MUT-01] fastapi/routing.py:54  InvertNegation (not state -> state)        --> KILLED  (test_router_lifespan_state_propagation)
  [MUT-02] fastapi/routing.py:62  SwapComparison (if resp is None -> is not) --> KILLED  (test_dependency_injection_scope)
  [MUT-03] fastapi/routing.py:71  ReturnValueModifier (return self -> None)  --> KILLED  (test_router_lifespan_state_propagation)
  [MUT-04] fastapi/routing.py:75  ExceptionSuppression                       --> KILLED  (test_fastapi_sub_application_mount)

Verification Verdict:
  Mutants Injected: 4  |  Mutants Killed: 4  |  Kill Rate: 100.0%
  Blind Spots Detected: 0
  Verdict: RELEASE_SAFE (Test suite reliably detects faults in modified surface)`,
  },
  {
    id: "doctor",
    label: "ripple doctor",
    badge: "Graph Health Diagnostic",
    command: "ripple doctor",
    output: `RippleCI System Health & Graph Diagnostic
FalkorDB Instance:   redis://127.0.0.1:6379  (HEALTHY, 1.4ms ping)
FalkorDB Version:    v0.4.0
Active Graph Name:   rippleci_workspace
Indexed Symbols:     54 functions & classes
Indexed Test Cases:  18 test definitions
CALLS Relationships: 98 verified AST edges
COVERS Coverage:     Verified coverage from coverage.py + AST proximity
Deterministic Fallback: MemoryGraphStore (Standby Ready)
Status: All Release Intelligence sub-systems operational.`,
  },
];

export function TerminalBlock() {
  const [activeTab, setActiveTab] = useState<string>("impact");
  const [copied, setCopied] = useState<boolean>(false);

  const current = COMMAND_TABS.find((t) => t.id === activeTab) || COMMAND_TABS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#1B3B3F] bg-[#0B0D10] overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="px-4 py-3 bg-[#121A2B] border-b border-[#1B3B3F] flex flex-wrap items-center justify-between gap-3">
        {/* Terminal dots */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5A952] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E4A32] inline-block" />
          </div>
          <span className="text-xs font-mono text-[#C9C4B8]/80 font-semibold flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-[#E5A952]" />
            <span>ripple-cli</span>
          </span>
        </div>

        {/* Command tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {COMMAND_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#E5A952]/25 text-[#C9C4B8] font-bold border border-[#E5A952]/60 shadow-[0_0_10px_rgba(229,169,82,0.25)]"
                    : "text-[#C9C4B8]/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Copy command button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-mono text-[#C9C4B8]/70 hover:text-white px-2.5 py-1 rounded-lg bg-[#0B0D10]/60 hover:bg-white/[0.06] border border-[#1B3B3F] transition-all ml-auto sm:ml-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#2E4A32]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Terminal prompt bar */}
      <div className="px-5 py-2.5 bg-[#0B0D10]/90 border-b border-[#1B3B3F]/70 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#E5A952] font-bold">$</span>
          <span className="text-white font-semibold">{current.command}</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1B3B3F]/70 text-[#C9C4B8] border border-[#1B3B3F] hidden sm:inline">
          {current.badge}
        </span>
      </div>

      {/* Output Body */}
      <div className="p-5 font-mono text-xs text-[#C9C4B8]/95 overflow-x-auto leading-relaxed max-h-[360px] scrollbar-thin bg-[#0B0D10]">
        <pre className="whitespace-pre">{current.output}</pre>
      </div>
    </div>
  );
}

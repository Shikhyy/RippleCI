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
    badge: "Graph Traversal",
    command: "ripple impact origin/main..HEAD",
    output: `RippleCI Impact Analysis  |  payments-core-service  |  origin/main..HEAD
Changed Files: 1  |  Modified Symbols: 1  |  Downstream Callers: 2  |  Candidate Tests: 4

Directly Modified Symbols:
  [MODIFIED] verify_token (src/auth.py:9-16)

Downstream Callers (FalkorDB Multi-Hop Traversal):
  [CALLER]   process_payment  (1 hop)   [src/payments.py:13]
             Path: process_payment -> verify_token
  [CALLER]   place_order      (2 hops)  [src/order_service.py:7]
             Path: place_order -> process_payment -> verify_token

Candidate Tests Connected via Graph:
  [DIRECT]   test_verify_valid_token       (1 hop  | tests/test_auth.py:5)
  [DIRECT]   test_verify_expired_token     (1 hop  | tests/test_auth.py:12)
  [INDIRECT] test_process_payment_success  (2 hops | tests/test_payments.py:8)
  [INDIRECT] test_place_order_success      (3 hops | tests/test_orders.py:10)

Next: ripple plan --budget 300`,
  },
  {
    id: "plan",
    label: "ripple plan",
    badge: "ML Prioritization",
    command: "ripple plan --budget 300",
    output: `Selected Test Plan (GBDT Ranker | Budget: 300.0s)
┌──────┬───────────────────────────────┬───────┬──────────┬────────────────────────────────────────────┐
│ Rank │ Test Case                     │ Score │ Duration │ Graph Evidence & Feature Attribution       │
├──────┼───────────────────────────────┼───────┼──────────┼────────────────────────────────────────────┤
│    1 │ test_verify_valid_token       │  0.96 │ 1.1s     │ Direct AST coverage; immediate neighbor    │
│    2 │ test_verify_expired_token     │  0.92 │ 1.0s     │ Direct AST coverage; boundary condition    │
│    3 │ test_process_payment_success  │  0.85 │ 1.4s     │ 1-hop caller; covers payment gateway path  │
│    4 │ test_place_order_success      │  0.78 │ 1.3s     │ 2-hop caller; covers order checkout flow   │
└──────┴───────────────────────────────┴───────┴──────────┴────────────────────────────────────────────┘
Selected 4 tests  |  Estimated runtime: 4.8s  |  Omitted: 9 tests (budget preserved)`,
  },
  {
    id: "investigate",
    label: "ripple investigate",
    badge: "Agent Reasoning",
    command: "ripple investigate origin/main..HEAD",
    output: `Autonomous Graph Reasoning Agent Execution Trace:
  [tool:analyze_change]           -> 1 modified symbol (verify_token in src/auth.py)
  [tool:trace_impact]             -> 2 downstream callers located via CALLS edges
  [tool:retrieve_test_candidates] -> 4 tests mapped across AST & pytest nodes
  [tool:rank_test_candidates]     -> 4 tests selected under 300s budget (4.8s est.)
  [tool:check_verification_gaps]  -> coverage_sufficient (0 blind spots detected)

Agent Verdict: VERIFIED_SAFE
Recommendation: All modified symbols have verified coverage in the dependency graph.`,
  },
  {
    id: "verify",
    label: "ripple verify",
    badge: "Mutation Testing",
    command: "ripple verify --mutations 5",
    output: `Executing selected test plan with bounded mutation verification...

Test Suite Execution:
  ✓ tests/test_auth.py::test_verify_valid_token       PASSED  (1.08s)
  ✓ tests/test_auth.py::test_verify_expired_token     PASSED  (0.98s)
  ✓ tests/test_payments.py::test_process_payment_ok   PASSED  (1.36s)
  ✓ tests/test_orders.py::test_place_order_ok         PASSED  (1.24s)

Bounded AST Mutation Verification:
  [MUTANT 1] src/auth.py:12 (Compare: == -> !=)       KILLED by test_verify_valid_token
  [MUTANT 2] src/auth.py:14 (UnaryOp: not -> identity) KILLED by test_verify_expired_token
  [MUTANT 3] src/auth.py:15 (Constant: True -> False)  KILLED by test_verify_valid_token
  [MUTANT 4] src/payments.py:18 (BinaryOp: + -> -)     KILLED by test_process_payment_ok
  [MUTANT 5] src/order_service.py:12 (Return None)     KILLED by test_place_order_ok

Verification Summary:
  Mutations Tested: 5  |  Killed: 5  |  Survived: 0
  Mutation Score:   100.0%
  Verdict:          RELEASE_SAFE`,
  },
  {
    id: "benchmark",
    label: "ripple benchmark",
    badge: "Empirical Grounding",
    command: "ripple benchmark",
    output: `Regression Test Selection Benchmark (4 Strategies | 3 Fault Injection Scenarios)
┌───────────────────────┬─────────────────┬───────────┬──────────────┬──────────────────────────────────┐
│ Strategy              │ Selection Ratio │ Avg. Time │ Fault Recall │ Missed Scenarios                 │
├───────────────────────┼─────────────────┼───────────┼──────────────┼──────────────────────────────────┤
│ full_suite            │ 100.0% (41/41)  │ 41.0s     │ 100.0%       │ None (baseline full execution)   │
│ change_file_heuristic │   8.9% (4/41)   │  3.7s     │  66.7%       │ auth_token_verification_bug (FAIL│
│ graph_only            │  11.4% (5/41)   │  5.6s     │ 100.0%       │ None (FalkorDB traversed callers)│
│ graph_plus_ml         │  11.4% (5/41)   │  5.6s     │ 100.0%       │ None (optimal risk-ordered plan) │
└───────────────────────┴─────────────────┴───────────┴──────────────┴──────────────────────────────────┘
Result: graph_plus_ml achieves 7.3x speedup while preserving 100% fault recall.`,
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
    <div className="craft-card overflow-hidden">
      {/* Workbench Header */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-[#0f0e17]/95 border-b border-[#6A4BFF]/20 gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-lg border border-white/[0.06] overflow-x-auto">
          {COMMAND_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-[#6A4BFF]/20 text-[#E4DBFF] font-semibold shadow-sm border border-[#6A4BFF]/40"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  activeTab === tab.id
                    ? "bg-[#6A4BFF]/30 text-[#E4DBFF] font-sans font-semibold"
                    : "text-zinc-500 font-sans"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#6A4BFF]/25 hover:border-[#6A4BFF]/50 bg-[#151322] hover:bg-[#1a172c] text-[#E4DBFF] font-mono text-xs transition-all shrink-0 active:scale-[0.98]"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#E4DBFF]/70" />}
          <span>{copied ? "Copied" : "Copy Command"}</span>
        </button>
      </div>

      {/* Command Prompt Line */}
      <div className="px-4 py-3 bg-[#0a0a0c] border-b border-white/[0.06] font-mono text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[#6A4BFF] select-none font-bold">$</span>
          <span className="text-white font-medium">{current.command}</span>
        </div>
        <span className="text-[11px] font-mono text-[#E4DBFF]/60">exit 0 · deterministic</span>
      </div>

      {/* Output Console View */}
      <div className="p-4 sm:p-5 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto max-h-[380px] bg-[#09090b]">
        <pre className="whitespace-pre">{current.output}</pre>
      </div>
    </div>
  );
}

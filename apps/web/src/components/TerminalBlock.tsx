"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CommandTab {
  id: string;
  command: string;
  output: string;
  tag: string;
}

const COMMAND_TABS: CommandTab[] = [
  {
    id: "impact",
    command: "ripple impact origin/main..HEAD",
    tag: "Blast Radius",
    output: `RippleCI Impact Analysis  |  sample-python-service  |  origin/main..HEAD
Changed Files: 1  |  Modified Symbols: 1  |  Downstream Callers: 2  |  Candidate Tests: 4

Directly Changed Symbols
  - verify_token (src/auth.py:9-16)

Impacted Callers (FalkorDB Traversal)
  - process_payment (1 hop)  [process_payment -> verify_token]
  - place_order     (2 hops) [place_order -> process_payment -> verify_token]

Candidate Tests Connected Via Graph
  ✓ test_verify_valid_token        (Direct coverage | 1 hop)
  ✓ test_verify_expired_token      (Direct coverage | 1 hop)
  ✓ test_process_payment_success   (Indirect caller | 2 hops)
  ✓ test_place_order_success       (Indirect caller | 3 hops)

Next: ripple plan --budget 300`,
  },
  {
    id: "plan",
    command: "ripple plan --budget 300",
    tag: "ML Ranking",
    output: `Selected Test Plan (MLRanker | Budget: 300s)
┏━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Rank ┃ Test Case                   ┃ Score ┃ Duration  ┃ Reasons                                ┃
┡━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━╇━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│    1 │ test_verify_valid_token     │  0.96 │ 1.1s      │ Direct coverage; immediate neighbor    │
│    2 │ test_verify_expired_token   │  0.92 │ 1.0s      │ Direct coverage; boundary check        │
│    3 │ test_process_payment_success│  0.85 │ 1.4s      │ 2-hop caller; covers payments path     │
│    4 │ test_place_order_success    │  0.78 │ 1.3s      │ 3-hop caller; covers fulfillment path  │
└──────┴─────────────────────────────┴───────┴───────────┴────────────────────────────────────────┘
Selected 4 tests | Estimated duration: 4.8s | Omitted: 0`,
  },
  {
    id: "verify",
    command: "ripple verify --mutations 5",
    tag: "Verification",
    output: `Executing selected tests and bounded mutations...

Verification Results
┏━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Metric                 ┃ Result                                  ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ All Tests Passed       │ YES                                     │
│ Tests Executed         │ 4/4 passed                              │
│ Mutations Tested       │ 5                                       │
│ Mutations Killed       │ 5 (100.0%)                              │
│ Surviving Mutants      │ 0                                       │
│ Wall Time              │ 4.85s                                   │
│ Release Recommendation │ RELEASE_SAFE                            │
└────────────────────────┴─────────────────────────────────────────┘
Verdict: High-confidence release evidence verified.`,
  },
  {
    id: "doctor",
    command: "ripple doctor",
    tag: "Diagnostics",
    output: `RippleCI Diagnostics
┏━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Component      ┃ Status                       ┃ Details                      ┃
┡━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ Python Runtime │ OK                           │ Python 3.12.5                │
│ Git Repository │ OK                           │ Git repo detected (branch:   │
│                │                              │ main)                        │
│ Configuration  │ OK                           │ File: .ripple.yml            │
│ FalkorDB Graph │ CONNECTED                    │ Reachable at redis://localhost:6379
│ Test Runner    │ OK                           │ pytest 9.0.2                 │
└────────────────┴──────────────────────────────┴──────────────────────────────┘`,
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
    <div className="rounded-xl border border-slate-800 bg-[#0B0F1A] shadow-2xl overflow-hidden font-mono text-xs">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-3 text-slate-400 font-sans text-xs flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-400" /> terminal — bash
          </span>
        </div>

        {/* Tab pills */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {COMMAND_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-sans transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Command prompt & copy */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-900 text-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">$</span>
          <span className="text-blue-300 font-semibold">{current.command}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-sans text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded border border-slate-800"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Command output */}
      <pre className="p-4 text-slate-300 leading-relaxed overflow-x-auto whitespace-pre font-mono text-[11px]">
        {current.output}
      </pre>
    </div>
  );
}

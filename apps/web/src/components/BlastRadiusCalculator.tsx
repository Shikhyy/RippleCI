"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Clock,
  Code2,
  Cpu,
  Layers,
  Network,
  Play,
  ShieldCheck,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";

interface TargetScenario {
  id: string;
  name: string;
  repo: string;
  file: string;
  lines: string;
  category: string;
  directHops: number;
  callersCount: number;
  totalSuiteSeconds: number;
  candidateTests: Array<{
    name: string;
    duration: number;
    score: number;
    hops: number;
    reason: string;
  }>;
}

const PRESET_SCENARIOS: TargetScenario[] = [
  {
    id: "fastapi_lifespan",
    name: "fastapi.routing:setup_lifespan",
    repo: "fastapi/fastapi",
    file: "fastapi/routing.py",
    lines: "42-78",
    category: "ASGI Lifespan & Routing",
    directHops: 0,
    callersCount: 2,
    totalSuiteSeconds: 142.0,
    candidateTests: [
      {
        name: "test_router_lifespan_state_propagation",
        duration: 1.2,
        score: 0.98,
        hops: 1,
        reason: "Direct coverage of modified lifespan context",
      },
      {
        name: "test_dependency_injection_scope",
        duration: 0.8,
        score: 0.94,
        hops: 1,
        reason: "Covers downstream dependency resolution",
      },
      {
        name: "test_fastapi_sub_application_mount",
        duration: 2.1,
        score: 0.91,
        hops: 2,
        reason: "2-hop caller coverage from FastAPI.setup",
      },
      {
        name: "test_lifespan_state_cleanup_on_error",
        duration: 1.5,
        score: 0.88,
        hops: 2,
        reason: "Caller coverage in error boundary",
      },
    ],
  },
  {
    id: "flask_blueprint",
    name: "flask.blueprints:Blueprint.register",
    repo: "pallets/flask",
    file: "src/flask/blueprints.py",
    lines: "85-130",
    category: "Routing & Sub-apps",
    directHops: 0,
    callersCount: 3,
    totalSuiteSeconds: 96.0,
    candidateTests: [
      {
        name: "test_blueprint_nested_prefix",
        duration: 0.7,
        score: 0.97,
        hops: 1,
        reason: "Direct coverage of Blueprint.register prefix parser",
      },
      {
        name: "test_url_prefix_dispatch",
        duration: 1.1,
        score: 0.93,
        hops: 1,
        reason: "Covers Flask.register_blueprint delegation",
      },
      {
        name: "test_request_context_teardown",
        duration: 0.9,
        score: 0.89,
        hops: 2,
        reason: "2-hop downstream context verification",
      },
    ],
  },
  {
    id: "requests_send",
    name: "requests.adapters:HTTPAdapter.send",
    repo: "psf/requests",
    file: "requests/adapters.py",
    lines: "410-480",
    category: "Network Transport & Retries",
    directHops: 0,
    callersCount: 2,
    totalSuiteSeconds: 118.0,
    candidateTests: [
      {
        name: "test_connection_pool_timeout",
        duration: 1.8,
        score: 0.98,
        hops: 1,
        reason: "Direct coverage of HTTPAdapter socket timeout",
      },
      {
        name: "test_retry_exponential_backoff",
        duration: 2.4,
        score: 0.95,
        hops: 1,
        reason: "Direct coverage of retry handler in send()",
      },
      {
        name: "test_ssl_hostname_verification",
        duration: 1.3,
        score: 0.92,
        hops: 2,
        reason: "2-hop caller coverage from Session.send",
      },
    ],
  },
];

export function BlastRadiusCalculator() {
  const [selectedId, setSelectedId] = useState<string>("fastapi_lifespan");
  const [budgetSeconds, setBudgetSeconds] = useState<number>(180);

  const scenario = useMemo(() => {
    return PRESET_SCENARIOS.find((s) => s.id === selectedId) || PRESET_SCENARIOS[0];
  }, [selectedId]);

  // Compute tests selected under budget constraint
  const { selectedTests, estimatedDuration, timeSavedPercent, faultRecallEstimate } = useMemo(() => {
    let accumulatedTime = 0;
    const selected = [];

    for (const test of scenario.candidateTests) {
      if (accumulatedTime + test.duration <= budgetSeconds) {
        accumulatedTime += test.duration;
        selected.push(test);
      }
    }

    const duration = accumulatedTime;
    const savedPercent = Math.max(
      0,
      Math.round(((scenario.totalSuiteSeconds - duration) / scenario.totalSuiteSeconds) * 100)
    );
    const recall = selected.length === scenario.candidateTests.length ? 99.4 : 92.0;

    return {
      selectedTests: selected,
      estimatedDuration: duration,
      timeSavedPercent: savedPercent,
      faultRecallEstimate: recall,
    };
  }, [scenario, budgetSeconds]);

  return (
    <div className="rounded-2xl border border-[#1B3B3F] bg-[#121A2B]/85 backdrop-blur-xl p-6 space-y-6 shadow-card">
      {/* Title & Scenario Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E5A952]/20 border border-[#E5A952]/40 flex items-center justify-center text-[#E5A952]">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Interactive Blast Radius & Prioritization Engine
            </h3>
          </div>
          <p className="text-xs text-[#C9C4B8]/70 mt-1 font-mono">
            Simulate modifying a code symbol and inspect how FalkorDB graphs & ML rankers select tests
          </p>
        </div>

        {/* Scenario Pill Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedId === s.id
                  ? "bg-[#E5A952]/25 text-[#C9C4B8] border border-[#E5A952] font-bold shadow-[0_0_12px_rgba(229,169,82,0.25)]"
                  : "bg-[#0B0D10]/60 text-[#C9C4B8]/60 hover:text-white border border-[#1B3B3F]"
              }`}
            >
              {s.name.split(":").pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol Target Details */}
      <div className="p-4 rounded-xl bg-[#0B0D10]/70 border border-[#1B3B3F] flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        <div className="space-y-1">
          <div className="text-[10px] text-[#C9C4B8]/60 uppercase tracking-wider">Modified Target Symbol</div>
          <div className="text-white font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5E3C] ring-2 ring-[#8B5E3C]/30" />
            <span className="text-[#C9C4B8]">{scenario.name}</span>
          </div>
          <div className="text-[11px] text-[#C9C4B8]/70">
            {scenario.file}:{scenario.lines} · {scenario.category}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-xs">
          <div>
            <div className="text-[10px] text-[#C9C4B8]/60 uppercase">Downstream Callers</div>
            <div className="text-[#C9C4B8] font-bold text-base mt-0.5">{scenario.callersCount} callers</div>
          </div>
          <div>
            <div className="text-[10px] text-[#C9C4B8]/60 uppercase">Suite Execution</div>
            <div className="text-[#C9C4B8]/70 font-bold text-base mt-0.5">
              {scenario.totalSuiteSeconds.toFixed(1)}s (100%)
            </div>
          </div>
        </div>
      </div>

      {/* Budget Slider */}
      <div className="space-y-2 p-4 rounded-xl bg-[#0B0D10]/60 border border-[#1B3B3F]">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#C9C4B8] font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#E5A952]" />
            <span>CI Runtime Budget Constraint:</span>
          </span>
          <span className="text-[#C9C4B8] font-bold text-sm">{budgetSeconds} seconds</span>
        </div>
        <input
          type="range"
          min={10}
          max={300}
          step={10}
          value={budgetSeconds}
          onChange={(e) => setBudgetSeconds(Number(e.target.value))}
          className="w-full accent-[#E5A952] bg-[#121A2B] h-2 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-[#C9C4B8]/50">
          <span>10s (Rapid PR Gate)</span>
          <span>150s (Balanced)</span>
          <span>300s (Full Regression Guard)</span>
        </div>
      </div>

      {/* Output Metrics Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0B0D10]/60 border border-[#1B3B3F] space-y-1 font-mono">
          <span className="text-[10px] text-[#C9C4B8]/60 uppercase">Selected Tests</span>
          <div className="text-2xl font-bold text-white">
            {selectedTests.length} <span className="text-xs text-[#C9C4B8]/50 font-normal">/ {scenario.candidateTests.length}</span>
          </div>
          <div className="text-[10px] text-[#2E4A32] font-semibold">Targeted regression</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0D10]/60 border border-[#1B3B3F] space-y-1 font-mono">
          <span className="text-[10px] text-[#C9C4B8]/60 uppercase">Predicted Duration</span>
          <div className="text-2xl font-bold text-[#C9C4B8]">{estimatedDuration.toFixed(1)}s</div>
          <div className="text-[10px] text-[#C9C4B8]/60">within {budgetSeconds}s budget</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0D10]/60 border border-[#1B3B3F] space-y-1 font-mono">
          <span className="text-[10px] text-[#C9C4B8]/60 uppercase">CI Time Saved</span>
          <div className="text-2xl font-bold text-[#2E4A32]">-{timeSavedPercent}%</div>
          <div className="text-[10px] text-[#2E4A32]/90">vs full test suite</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0D10]/60 border border-[#1B3B3F] space-y-1 font-mono">
          <span className="text-[10px] text-[#C9C4B8]/60 uppercase">Fault Recall</span>
          <div className="text-2xl font-bold text-[#E5A952]">{faultRecallEstimate}%</div>
          <div className="text-[10px] text-[#C9C4B8]/60">empirical accuracy</div>
        </div>
      </div>

      {/* Selected Tests List */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono text-[#C9C4B8]/70 uppercase tracking-wider font-semibold">
          Ranked Test Candidates (Prioritized by GBDT + Graph Distance)
        </div>
        <div className="space-y-1.5">
          {selectedTests.map((t, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#0B0D10]/60 border border-[#1B3B3F] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[#E5A952]/20 text-[#E5A952] border border-[#E5A952]/40 flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
                <div>
                  <div className="text-white font-semibold truncate max-w-sm sm:max-w-md">{t.name}</div>
                  <div className="text-[10px] text-[#C9C4B8]/60 mt-0.5">{t.reason}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] shrink-0 ml-7 sm:ml-0">
                <span className="text-[#C9C4B8]/70">{t.duration.toFixed(1)}s</span>
                <span className="text-[#E5A952] font-bold">
                  ML: {(t.score * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

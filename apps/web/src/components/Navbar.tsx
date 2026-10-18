"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Github, Network, Layers, GitPullRequest, Terminal } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full glass-header">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[#111116] border border-amber-500/30 flex items-center justify-center shadow-rim">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M9 12h6M15 6l-6 6M15 18l-6-6" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-200 transition-colors">
              Ripple<span className="text-amber-400 font-bold">CI</span>
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 pl-2.5 border-l border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono text-amber-200/70">falkordb v0.1</span>
          </div>
        </div>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-400">
          <Link
            href="/app"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              pathname === "/app"
                ? "bg-amber-500/15 text-amber-200 border border-amber-500/30 font-semibold"
                : "hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/app/graph"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              pathname === "/app/graph"
                ? "bg-amber-500/15 text-amber-200 border border-amber-500/30 font-semibold"
                : "hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Graph Explorer
          </Link>
          <Link
            href="/#sdk"
            className="px-3 py-1.5 rounded-lg transition-all hover:text-white hover:bg-white/[0.04]"
          >
            Python SDK
          </Link>
          <Link
            href="/app/runs/run_prod_8f12a9"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              pathname?.startsWith("/app/runs")
                ? "bg-amber-500/15 text-amber-200 border border-amber-500/30 font-semibold"
                : "hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            PR Release Report
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <span>API Docs</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-500" />
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://github.com/Shikhyy/RippleCI.git"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/[0.08] hover:border-amber-500/40 bg-[#111116] transition-all font-medium"
          >
            <Github className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <Link
            href="/app"
            className="flex items-center gap-1 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 rounded-lg transition-all shadow-[0_1px_14px_rgba(245,158,11,0.4),inset_0_1px_0_rgba(254,243,199,0.5)] active:scale-[0.98]"
          >
            <span>Launch Workbench</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

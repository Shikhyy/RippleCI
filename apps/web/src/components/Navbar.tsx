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
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.12] flex items-center justify-center shadow-rim">
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M9 12h6M15 6l-6 6M15 18l-6-6" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-200 transition-colors">
              Ripple<span className="text-blue-500 font-normal">CI</span>
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono text-zinc-400">falkordb v0.1</span>
          </div>
        </div>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-400">
          <Link
            href="/app"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/app"
                ? "bg-white/[0.08] text-white"
                : "hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/app/graph"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/app/graph"
                ? "bg-white/[0.08] text-white"
                : "hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Graph Explorer
          </Link>
          <Link
            href="/app/runs/run_prod_8f12a9"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname?.startsWith("/app/runs")
                ? "bg-white/[0.08] text-white"
                : "hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            PR Release Report
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:text-white hover:bg-white/[0.04] transition-colors"
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
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.16] bg-zinc-900/80 transition-all font-medium"
          >
            <Github className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <Link
            href="/app"
            className="flex items-center gap-1 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-100 px-3.5 py-1.5 rounded-lg transition-all shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98]"
          >
            <span>Launch Workbench</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

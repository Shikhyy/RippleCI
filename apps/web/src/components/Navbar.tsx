import React from "react";
import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1E222A] bg-[#090A0D]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm tracking-tight text-[#EDEDEE]">
              ripple<span className="text-[#3B82F6]">ci</span>
            </span>
          </Link>
          <span className="text-[#333945]">/</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded border border-[#222733] bg-[#12141A] text-[#8B919D]">
            release intelligence
          </span>
        </div>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-[#8B919D]">
          <Link href="/app" className="hover:text-[#EDEDEE] transition-colors">
            Dashboard
          </Link>
          <Link href="/app/graph" className="hover:text-[#EDEDEE] transition-colors">
            Graph Explorer
          </Link>
          <Link href="/app/runs/run_prod_8f12a9" className="hover:text-[#EDEDEE] transition-colors">
            PR Inspection
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-[#EDEDEE] transition-colors"
          >
            <span>API Docs</span>
            <ArrowUpRight className="w-3 h-3 text-[#636975]" />
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Shikhyy/RippleCI.git"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#8B919D] hover:text-[#EDEDEE] px-2.5 py-1.5 rounded border border-[#222733] hover:border-[#2C323D] bg-[#101216] transition-colors font-mono"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <Link
            href="/app"
            className="flex items-center gap-1 text-xs font-mono font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-1.5 rounded transition-colors"
          >
            <span>Open Workbench</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

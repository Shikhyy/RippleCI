"use client";

import React, { useState } from "react";
import { CanvasRevealEffect } from "./ui/canvas-reveal-effect";
import { Network, Zap, ShieldCheck, ArrowRight, GitCommit, Cpu, FlaskConical } from "lucide-react";
import Link from "next/link";

export function CanvasRevealEffectDemo3() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5A952]/40 bg-[#121A2B] text-[#C9C4B8] font-mono text-xs uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5A952] animate-pulse" />
          The Triad Architecture
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Engineered for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9C4B8] via-[#E5A952] to-[#8B5E3C]">
            Deterministic Safety
          </span>
        </h2>
        <p className="text-[#C9C4B8]/80 text-base sm:text-lg leading-relaxed">
          Hover over each pillar to inspect how FalkorDB AST graph traversal, learned test prioritization, and counterfactual mutations protect production releases.
        </p>
      </div>

      {/* 3-Card Interactive Grid with Canvas Reveal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Card 1: FalkorDB Graph */}
        <Card
          badge="PHASE 01 // GRAPH AST"
          title="FalkorDB AST Dependency Graph"
          description="Maps Python Abstract Syntax Trees into persistent Cypher graph vertices. Resolves precise causal chains from git diff line changes to downstream callers."
          metricLabel="Cypher Traversal"
          metricValue="< 15ms"
          icon={<Network className="h-10 w-10 text-[#C9C4B8]" />}
        >
          <CanvasRevealEffect
            animationSpeed={1.8}
            containerClassName="bg-[#1B3B3F]/40"
            colors={[
              [27, 59, 63],    // TEAL SHADOW
              [229, 169, 82],  // AMBER GOLD
              [201, 196, 184], // MOON STONE
            ]}
            dotSize={2.5}
          />
        </Card>

        {/* Card 2: ML Prioritization */}
        <Card
          badge="PHASE 02 // LEARNED RTS"
          title="Learned Test Prioritization"
          description="Ranks affected tests using graph centrality, historical flake probability, and execution duration. Shrinks full-suite runs by 90%+ within your CI budget."
          metricLabel="Fault Recall Rate"
          metricValue="100.0%"
          icon={<Cpu className="h-10 w-10 text-[#E5A952]" />}
        >
          <CanvasRevealEffect
            animationSpeed={2.2}
            containerClassName="bg-[#8B5E3C]/20"
            colors={[
              [229, 169, 82],  // AMBER GOLD
              [139, 94, 60],   // CINNAMON EARTH
              [201, 196, 184], // MOON STONE
            ]}
            dotSize={2.5}
          />
        </Card>

        {/* Card 3: Counterfactual Mutations */}
        <Card
          badge="PHASE 03 // ACTIVE MUTATION"
          title="Counterfactual Mutation Testing"
          description="Injects bounded in-memory AST mutations into modified symbols to verify that selected tests kill regressions before any code merges."
          metricLabel="Kill Threshold"
          metricValue="≥ 80.0%"
          icon={<FlaskConical className="h-10 w-10 text-[#5B4A5F]" />}
        >
          <CanvasRevealEffect
            animationSpeed={1.6}
            containerClassName="bg-[#2E4A32]/30"
            colors={[
              [46, 74, 50],    // FOREST MOSS
              [91, 74, 95],    // DUSK MAUVE
              [201, 196, 184], // MOON STONE
            ]}
            dotSize={2.5}
          />
        </Card>
      </div>

      {/* Bottom CTA to App Cockpit */}
      <div className="mt-14 text-center">
        <Link
          href="/app"
          className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-extrabold bg-[#E5A952] hover:bg-[#F5BD66] text-[#0B0D10] shadow-lg shadow-[#E5A952]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Launch Interactive Cockpit Demo</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

interface CardProps {
  badge: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  badge,
  title,
  description,
  metricLabel,
  metricValue,
  icon,
  children,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-[#1B3B3F] hover:border-[#E5A952]/70 group/canvas-card flex flex-col justify-between max-w-sm w-full mx-auto p-6 relative min-h-[440px] rounded-2xl overflow-hidden bg-[#121A2B]/85 backdrop-blur-md transition-all duration-300 shadow-card"
    >
      {/* Corner crosshairs matching Aceternity Demo-3 aesthetic */}
      <CrosshairIcon className="absolute h-5 w-5 -top-2.5 -left-2.5 text-[#1B3B3F] group-hover/canvas-card:text-[#E5A952] transition-colors duration-300" />
      <CrosshairIcon className="absolute h-5 w-5 -bottom-2.5 -left-2.5 text-[#1B3B3F] group-hover/canvas-card:text-[#E5A952] transition-colors duration-300" />
      <CrosshairIcon className="absolute h-5 w-5 -top-2.5 -right-2.5 text-[#1B3B3F] group-hover/canvas-card:text-[#E5A952] transition-colors duration-300" />
      <CrosshairIcon className="absolute h-5 w-5 -bottom-2.5 -right-2.5 text-[#1B3B3F] group-hover/canvas-card:text-[#E5A952] transition-colors duration-300" />

      {/* Dynamic Animated Canvas Layer on Hover */}
      <div
        className={`h-full w-full absolute inset-0 z-0 transition-opacity duration-700 ${
          hovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {children}
      </div>

      {/* Card Header & Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          {/* Badge */}
          <div className="flex items-center justify-between mb-8">
            <span className="font-mono text-[11px] font-semibold text-[#C9C4B8]/80 bg-[#0B0D10]/80 px-2.5 py-1 rounded-md border border-[#1B3B3F]">
              {badge}
            </span>
            <div className="w-2 h-2 rounded-full bg-[#1B3B3F] group-hover/canvas-card:bg-[#E5A952] transition-colors duration-300" />
          </div>

          {/* Central Animated Icon */}
          <div className="mb-6 flex items-center justify-center p-4 rounded-xl bg-[#0B0D10]/80 border border-[#1B3B3F] group-hover/canvas-card:border-[#E5A952]/50 group-hover/canvas-card:bg-[#0B0D10] transition-all duration-300 w-16 h-16 shadow-inner">
            {icon}
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover/canvas-card:text-[#C9C4B8] transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-[#C9C4B8]/75 leading-relaxed font-normal">
            {description}
          </p>
        </div>

        {/* Footer Metrics */}
        <div className="mt-8 pt-4 border-t border-[#1B3B3F]/80 flex items-center justify-between">
          <span className="text-xs font-mono text-[#C9C4B8]/50 uppercase tracking-wider">
            {metricLabel}
          </span>
          <span className="text-sm font-mono font-bold text-[#C9C4B8] bg-[#0B0D10]/80 px-2.5 py-0.5 rounded border border-[#1B3B3F]">
            {metricValue}
          </span>
        </div>
      </div>
    </div>
  );
};

const CrosshairIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
};

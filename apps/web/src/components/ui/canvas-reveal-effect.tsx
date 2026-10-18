"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface CanvasRevealEffectProps {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
}

export const CanvasRevealEffect: React.FC<CanvasRevealEffectProps> = ({
  animationSpeed = 1.5,
  opacities = [0.2, 0.2, 0.2, 0.3, 0.4, 0.5, 0.7, 0.9, 1],
  colors = [[107, 110, 58]],
  containerClassName,
  dotSize = 2.5,
  showGradient = true,
}) => {
  return (
    <div className={cn("h-full relative w-full overflow-hidden", containerClassName)}>
      <DotMatrix
        colors={colors}
        dotSize={dotSize}
        opacities={opacities}
        animationSpeed={animationSpeed}
      />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-transparent to-[#0B0D10]/60 pointer-events-none" />
      )}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_80%)] pointer-events-none" />
    </div>
  );
};

interface DotMatrixProps {
  colors: number[][];
  opacities: number[];
  animationSpeed: number;
  dotSize: number;
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors,
  opacities,
  animationSpeed,
  dotSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    const spacing = 16;
    let time = 0;

    const render = () => {
      if (!ctx || width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      time += 0.015 * animationSpeed;

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;

          // Wave equation radiating outward with periodic pulse
          const dx = x - width / 2;
          const dy = y - height / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const wave = Math.sin(dist * 0.05 - time * 2) * Math.cos(x * 0.03 + y * 0.03 + time);

          // Select color and opacity
          const colorIndex = Math.abs(Math.floor(i + j + time * 3)) % colors.length;
          const rgb = colors[colorIndex] || colors[0];
          const opacityIndex = Math.min(
            Math.max(0, Math.floor(((wave + 1) / 2) * (opacities.length - 1))),
            opacities.length - 1
          );
          const baseAlpha = opacities[opacityIndex] || 0.3;

          // Extra center glow falloff
          const centerAlpha = Math.max(0, 1 - dist / (Math.max(width, height) * 0.7));
          const finalAlpha = Math.max(0.08, baseAlpha * centerAlpha);

          ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${finalAlpha})`;
          ctx.beginPath();
          ctx.arc(x, y, dotSize * (0.8 + ((wave + 1) / 2) * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
    };
  }, [colors, opacities, animationSpeed, dotSize]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
};

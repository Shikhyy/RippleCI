"use client";

import React, { useEffect, useRef } from "react";

export interface SpectralDrapeProps {
  colors?: [string, string]; // [baseColor, highlightColor]
  backgroundColor?: string;
  density?: number;
  dotSize?: number;
  strands?: number;
  amplitude?: number;
  frequency?: number;
  thickness?: number;
  depth?: number;
  softness?: number;
  intensity?: number;
  colorShift?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  zoom?: number;
  flow?: number;
  speed?: number;
  interactive?: boolean;
  brush?: number;
  brushRadius?: number;
  className?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [106 / 255, 75 / 255, 255 / 255];
  return [(num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

export function SpectralDrape({
  colors = ["#6A4BFF", "#E4DBFF"],
  backgroundColor = "transparent",
  density = 1,
  dotSize = 1.1,
  strands = 8,
  amplitude = 1,
  frequency = 1,
  thickness = 0.7,
  depth = 1,
  softness = 0.6,
  intensity = 1,
  colorShift = 0.35,
  tilt = -40,
  turn = -45,
  roll = 110,
  zoom = 1,
  flow = 1,
  speed = 1,
  interactive = true,
  brush = 1,
  brushRadius = 0.25,
  className = "",
}: SpectralDrapeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { alpha: true, antialias: true }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) return;

    // Vertex Shader
    const vsSource = `
      attribute vec2 a_gridPos;

      uniform float u_time;
      uniform float u_flow;
      uniform float u_amplitude;
      uniform float u_frequency;
      uniform float u_thickness;
      uniform float u_depth;
      uniform float u_colorShift;
      uniform float u_dotSize;
      uniform float u_pixelRatio;
      uniform float u_zoom;
      uniform vec2 u_mouse;
      uniform float u_interactive;
      uniform float u_brush;
      uniform float u_brushRadius;
      uniform mat3 u_rotMatrix;

      varying float v_elevation;

      void main() {
        float u = a_gridPos.x;
        float v = a_gridPos.y;

        // Harmonic 3D wave strands lifting sheet into flowing folds
        float wave = 0.0;
        for (int i = 1; i <= 8; i++) {
          float fi = float(i);
          float phase = u_time * u_flow * 0.35 * (0.85 + 0.18 * fi);
          float freq = u_frequency * (0.95 + 0.32 * fi);
          float strandCenter = sin(u * freq + phase) * 0.48 * u_amplitude;
          float distToStrand = abs(v - strandCenter);
          float influence = exp(-pow(distToStrand / max(0.01, u_thickness * 0.42), 2.0));
          wave += influence * sin(u * 2.2 + phase * 1.3) * (0.55 / sqrt(fi));
        }

        // Secondary cross-undulations for organic drape motion
        float z = (wave + sin(u * 2.6 + u_time * 0.3) * cos(v * 2.2 + u_time * 0.25) * 0.26) * u_depth;
        vec3 pos = vec3(u, v, z);

        // Pointer brush displacement
        if (u_interactive > 0.5) {
          vec2 d = pos.xy - u_mouse;
          float dist = length(d);
          if (dist < u_brushRadius && dist > 0.0001) {
            float push = (1.0 - dist / u_brushRadius) * u_brush * 0.22;
            pos.xy += normalize(d) * push;
            pos.z += push * 0.6;
          }
        }

        // 3D Rotation
        vec3 rotPos = u_rotMatrix * pos;

        // Perspective camera projection
        float cameraDist = 2.45;
        float pz = rotPos.z + cameraDist;
        pz = max(0.5, pz);

        vec2 proj = (rotPos.xy * u_zoom * 1.15) / (pz * 0.58);
        gl_Position = vec4(proj, rotPos.z * 0.08, 1.0);

        // Point size scaled with perspective
        gl_PointSize = max(1.0, (u_dotSize * 3.6 * u_pixelRatio) / pz);

        // Normalized elevation for smooth color gradient
        float elev = clamp((z + 0.45) / 0.9 + (v * 0.5 + 0.5) * u_colorShift, 0.0, 1.0);
        v_elevation = elev;
      }
    `;

    // Fragment Shader
    const fsSource = `
      precision mediump float;

      uniform vec3 u_colorBase;
      uniform vec3 u_colorCrest;
      uniform float u_softness;
      uniform float u_intensity;

      varying float v_elevation;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        // Radial falloff for luminous glowing dots
        float alpha = smoothstep(0.5, 0.5 * (1.0 - u_softness), dist) * u_intensity;
        vec3 col = mix(u_colorBase, u_colorCrest, v_elevation);

        gl_FragColor = vec4(col, alpha);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    gl.useProgram(program);

    // Uniform locations
    const uTimeLoc = gl.getUniformLocation(program, "u_time");
    const uFlowLoc = gl.getUniformLocation(program, "u_flow");
    const uAmpLoc = gl.getUniformLocation(program, "u_amplitude");
    const uFreqLoc = gl.getUniformLocation(program, "u_frequency");
    const uThickLoc = gl.getUniformLocation(program, "u_thickness");
    const uDepthLoc = gl.getUniformLocation(program, "u_depth");
    const uColorShiftLoc = gl.getUniformLocation(program, "u_colorShift");
    const uDotSizeLoc = gl.getUniformLocation(program, "u_dotSize");
    const uPixelRatioLoc = gl.getUniformLocation(program, "u_pixelRatio");
    const uZoomLoc = gl.getUniformLocation(program, "u_zoom");
    const uMouseLoc = gl.getUniformLocation(program, "u_mouse");
    const uInteractiveLoc = gl.getUniformLocation(program, "u_interactive");
    const uBrushLoc = gl.getUniformLocation(program, "u_brush");
    const uBrushRadiusLoc = gl.getUniformLocation(program, "u_brushRadius");
    const uRotMatrixLoc = gl.getUniformLocation(program, "u_rotMatrix");
    const uColorBaseLoc = gl.getUniformLocation(program, "u_colorBase");
    const uColorCrestLoc = gl.getUniformLocation(program, "u_colorCrest");
    const uSoftnessLoc = gl.getUniformLocation(program, "u_softness");
    const uIntensityLoc = gl.getUniformLocation(program, "u_intensity");

    // Static uniforms
    const rgbBase = hexToRgb(colors[0] || "#6A4BFF");
    const rgbCrest = hexToRgb(colors[1] || "#E4DBFF");
    gl.uniform3f(uColorBaseLoc, rgbBase[0], rgbBase[1], rgbBase[2]);
    gl.uniform3f(uColorCrestLoc, rgbCrest[0], rgbCrest[1], rgbCrest[2]);
    gl.uniform1f(uFlowLoc, flow);
    gl.uniform1f(uAmpLoc, amplitude);
    gl.uniform1f(uFreqLoc, frequency);
    gl.uniform1f(uThickLoc, thickness);
    gl.uniform1f(uDepthLoc, depth);
    gl.uniform1f(uColorShiftLoc, colorShift);
    gl.uniform1f(uDotSizeLoc, dotSize);
    gl.uniform1f(uZoomLoc, zoom);
    gl.uniform1f(uInteractiveLoc, interactive ? 1.0 : 0.0);
    gl.uniform1f(uBrushLoc, brush);
    gl.uniform1f(uBrushRadiusLoc, brushRadius);
    gl.uniform1f(uSoftnessLoc, softness);
    gl.uniform1f(uIntensityLoc, intensity);

    // Compute 3D Rotation Matrix from (tilt, turn, roll) in degrees
    const deg2rad = Math.PI / 180;
    const rx = tilt * deg2rad;
    const ry = turn * deg2rad;
    const rz = roll * deg2rad;

    const cx = Math.cos(rx), sx = Math.sin(rx);
    const cy = Math.cos(ry), sy = Math.sin(ry);
    const cz = Math.cos(rz), sz = Math.sin(rz);

    // Mat3 column-major: Ry * Rx * Rz
    const m00 = cy * cz - sy * sx * sz;
    const m01 = cx * sz;
    const m02 = sy * cz + cy * sx * sz;

    const m10 = -cy * sz - sy * sx * cz;
    const m11 = cx * cz;
    const m12 = -sy * sz + cy * sx * cz;

    const m20 = -sy * cx;
    const m21 = -sx;
    const m22 = cy * cx;

    gl.uniformMatrix3fv(uRotMatrixLoc, false, [
      m00, m10, m20,
      m01, m11, m21,
      m02, m12, m22,
    ]);

    // Build grid vertices (approx 44,000 dots default)
    const baseCols = Math.round(210 * Math.sqrt(density));
    const baseRows = Math.round(190 * Math.sqrt(density));
    const totalPoints = baseCols * baseRows;
    const positions = new Float32Array(totalPoints * 2);

    let idx = 0;
    for (let r = 0; r < baseRows; r++) {
      const v = (r / (baseRows - 1)) * 2 - 1;
      for (let c = 0; c < baseCols; c++) {
        const u = (c / (baseCols - 1)) * 2 - 1;
        positions[idx++] = u;
        positions[idx++] = v;
      }
    }

    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aGridPosLoc = gl.getAttribLocation(program, "a_gridPos");
    gl.enableVertexAttribArray(aGridPosLoc);
    gl.vertexAttribPointer(aGridPosLoc, 2, gl.FLOAT, false, 0, 0);

    // Enable Alpha Blending for glowing dot accumulation
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive luminous glow blending

    // Mouse Tracking
    let targetMouseX = 999.0;
    let targetMouseY = 999.0;
    let currMouseX = 999.0;
    let currMouseY = 999.0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouseX = x;
      targetMouseY = y;
    };

    const onPointerLeave = () => {
      targetMouseX = 999.0;
      targetMouseY = 999.0;
    };

    if (interactive) {
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseleave", onPointerLeave);
    }

    // Resize handling
    let animId: number;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.uniform1f(uPixelRatioLoc, dpr);
    };

    window.addEventListener("resize", resize);
    resize();

    // Render loop
    const startTime = performance.now();
    const render = (time: number) => {
      const elapsed = ((time - startTime) / 1000) * speed;

      // Smooth mouse easing
      currMouseX += (targetMouseX - currMouseX) * 0.1;
      currMouseY += (targetMouseY - currMouseY) * 0.1;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform2f(uMouseLoc, currMouseX, currMouseY);

      gl.drawArrays(gl.POINTS, 0, totalPoints);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (interactive) {
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseleave", onPointerLeave);
      }
      gl.deleteBuffer(vBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [
    colors,
    density,
    dotSize,
    strands,
    amplitude,
    frequency,
    thickness,
    depth,
    softness,
    intensity,
    colorShift,
    tilt,
    turn,
    roll,
    zoom,
    flow,
    speed,
    interactive,
    brush,
    brushRadius,
  ]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-auto"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

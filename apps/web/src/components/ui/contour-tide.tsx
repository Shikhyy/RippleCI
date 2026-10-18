"use client";

import React, { useEffect, useRef, useMemo, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface ContourTideProps {
  colors?: [string, string];
  backgroundColor?: string;
  density?: number;
  particleSize?: number;
  waveHeight?: number;
  choppiness?: number;
  wavelength?: number;
  windAngle?: number;
  horizon?: number;
  fog?: number;
  glow?: number;
  foam?: number;
  speed?: number;
  interactive?: boolean;
  parallax?: number;
  swell?: number;
  swellRadius?: number;
  clickRipples?: boolean;
  seed?: number;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const DEFAULT_COLORS: [string, string] = ["#333333", "#FFFFFF"];

// GLSL Common Definition and Wave Physics
const SHADER_COMMON = `
#define WAVES 14
#define MAX_RIPPLES 4

uniform float uTime;
uniform float uNear;
uniform float uFar;
uniform float uSpread;
uniform float uSpreadBase;
uniform vec4 uWave[WAVES];
uniform vec4 uWaveMotion[WAVES];
uniform float uHeight;
uniform vec4 uCursor;
uniform float uCursorRadius;
uniform vec4 uRipple[MAX_RIPPLES];

float gridDepth(float v) {
  float inverse = 1.0 / uFar + (1.0 / uNear - 1.0 / uFar) * pow(clamp(1.0 - v, 0.0, 1.0), 1.8);
  return 1.0 / inverse;
}

vec3 surfacePoint(vec2 ground, out vec3 normal, out float fold, out float swell) {
  vec3 offset = vec3(0.0);
  normal = vec3(0.0, 1.0, 0.0);
  fold = 1.0;
  float calm = mix(0.3, 1.0, smoothstep(uNear * 0.9, uNear * 4.0, -ground.y));
  for (int i = 0; i < WAVES; i++) {
    vec4 wave = uWave[i];
    vec4 motion = uWaveMotion[i];
    float phase = wave.z * dot(wave.xy, ground) - motion.x * uTime + motion.y;
    float s = sin(phase);
    float c = cos(phase);
    float amplitude = wave.w * uHeight * calm;
    float steep = motion.z;
    offset.x += steep * amplitude * wave.x * c;
    offset.z += steep * amplitude * wave.y * c;
    offset.y += amplitude * s;
    float ka = wave.z * amplitude;
    normal.x -= wave.x * ka * c;
    normal.z -= wave.y * ka * c;
    normal.y -= steep * ka * s;
    fold -= steep * ka * s;
  }

  vec2 toCursor = ground - uCursor.xy;
  float radius2 = max(uCursorRadius * uCursorRadius, 1e-4);
  swell = uCursor.z * exp(-dot(toCursor, toCursor) / radius2);
  offset.y += swell;
  normal.x += swell * 2.0 * toCursor.x / radius2;
  normal.z += swell * 2.0 * toCursor.y / radius2;

  for (int k = 0; k < MAX_RIPPLES; k++) {
    vec4 ripple = uRipple[k];
    if (ripple.w <= 0.001) continue;
    vec2 away = ground - ripple.xy;
    float r = max(length(away), 1e-4);
    float band = r - ripple.z;
    float envelope = exp(-band * band * 3.0) * ripple.w * 0.26;
    offset.y += sin(band * 9.0) * envelope;
    float slope = (9.0 * cos(band * 9.0) - 6.0 * band * sin(band * 9.0)) * envelope;
    normal.x -= slope * away.x / r;
    normal.z -= slope * away.y / r;
  }

  return vec3(ground.x + offset.x, offset.y, ground.y + offset.z);
}
`;

const OCCLUSION_VERTEX = `
${SHADER_COMMON}

attribute vec2 aGrid;

void main() {
  float depth = gridDepth(aGrid.y);
  float halfWidth = uSpreadBase + depth * uSpread;
  vec2 ground = vec2(aGrid.x * halfWidth * 1.03, -depth);
  vec3 normal;
  float fold;
  float swell;
  vec3 world = surfacePoint(ground, normal, fold, swell);
  world.y -= 0.035 + depth * 0.004;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

const OCCLUSION_FRAGMENT = `
void main() {
  gl_FragColor = vec4(0.0);
}
`;

const PARTICLES_VERTEX = `
${SHADER_COMMON}

attribute vec2 aGrid;
attribute vec2 aJitter;

uniform float uRows;
uniform float uColumns;
uniform vec3 uSun;
uniform float uFogDistance;
uniform float uFoam;
uniform float uSize;
uniform float uFocal;
uniform float uPixelRatio;
uniform float uGlow;

varying float vBright;
varying float vTone;

void main() {
  float depth = gridDepth(aGrid.y + aJitter.y / uRows);
  float halfWidth = uSpreadBase + depth * uSpread;
  vec2 ground = vec2((aGrid.x + aJitter.x / uColumns) * halfWidth, -depth);
  float side = 1.0 - smoothstep(0.9, 1.0, abs(aGrid.x));
  vec3 normal;
  float fold;
  float swell;
  vec3 world = surfacePoint(ground, normal, fold, swell);
  vec3 offset = vec3(world.x - ground.x, world.y, world.z - ground.y);
  vec4 view = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * view;

  vec3 n = normalize(normal);
  vec3 toEye = normalize(cameraPosition - world);
  float lit = max(dot(n, uSun), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(n, toEye), 0.0), 5.0);
  float glint = pow(max(dot(reflect(-uSun, n), toEye), 0.0), 40.0) * (0.04 + 3.6 * fresnel);
  float crest = smoothstep(0.25, 1.0, offset.y / max(uHeight * 0.5, 0.01));
  float froth = smoothstep(0.7, 0.2, fold) * uFoam;
  float near = smoothstep(uNear * 0.95, uNear * 1.2, depth) * side;
  float distant = smoothstep(uNear * 1.1, uNear * 5.0, depth);
  float far = exp(-depth / max(uFogDistance, 0.5)) * smoothstep(uFar, uFar * 0.9, depth);

  float edgeOn = clamp(abs(dot(n, toEye)) / 0.35, 0.06, 1.0);
  float pileUp = mix(edgeOn, 1.0, smoothstep(uNear * 3.0, uNear * 14.0, depth));
  float brightness = (0.24 + 0.05 * lit + 0.9 * fresnel * distant + (glint * 2.6 + 2.4 * crest * crest * crest + froth * 2.6) * mix(0.3, 1.0, distant)) * pileUp * near * far;
  vTone = clamp(glint * 0.9 + crest * 0.6 + froth, 0.0, 1.0);

  float pixels = uSize * uFocal / max(-view.z, 0.05) * (1.0 + crest * 0.4) * uPixelRatio;
  float coverage = min(pixels, 1.0);
  vBright = brightness * coverage;
  gl_PointSize = clamp(pixels, 1.25, 7.5 * uPixelRatio) * (1.0 + uGlow * 1.8);
}
`;

const PARTICLES_FRAGMENT = `
precision highp float;

uniform vec3 uTrough;
uniform vec3 uCrest;
uniform float uGlow;
uniform float uInk;
uniform float uIntensity;

varying float vBright;
varying float vTone;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c) * 2.0;
  float edge = 1.0 / (1.0 + uGlow * 1.8);
  float core = 1.0 - smoothstep(edge * 0.45, edge, r);
  float halo = exp(-r * r * 5.5) * uGlow * 0.45;
  float amount = (core + halo * 1.25) * vBright * uIntensity * 1.65;
  if (amount < 0.001) discard;
  vec3 color = mix(uTrough, uCrest, vTone);
  if (uInk > 0.5) {
    float alpha = clamp(amount * 1.6, 0.0, 1.0);
    gl_FragColor = vec4(color * alpha, alpha);
  } else {
    float alpha = clamp(amount, 0.0, 1.0);
    gl_FragColor = vec4(color * amount, alpha);
  }
}
`;

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
const degToRad = (deg: number) => (deg * Math.PI) / 180;

const isTransparent = (color: string) => {
  const t = color.trim().toLowerCase();
  return (
    t === "transparent" ||
    (/^#[0-9a-f]{8}$/.test(t)
      ? t.endsWith("00")
      : /^#[0-9a-f]{4}$/.test(t)
      ? t.endsWith("0")
      : Boolean(t.match(/^(?:rgba?|hsla?)\(.*[,/]\s*(0|0?\.0+|0%)\s*\)$/)))
  );
};

const tempColor = new THREE.Color();
const parseColorInto = (targetVector: THREE.Vector3, colorStr: string, fallbackStr: string) => {
  const clean = colorStr.trim();
  try {
    tempColor.set(/^#[0-9a-f]{8}$/i.test(clean) ? clean.slice(0, 7) : clean);
  } catch {
    tempColor.set(fallbackStr);
  }
  targetVector.set(tempColor.r, tempColor.g, tempColor.b);
};

const createPrng = (seed: number) => {
  let t = (0x9e3779b9 ^ Math.floor(9973 * seed)) >>> 0;
  return () => {
    let e = (t = (t + 0x6d2b79f5) >>> 0);
    e = Math.imul(e ^ (e >>> 15), 1 | e);
    return (((e ^= e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ (e >>> 14)) >>> 0) / 0x100000000;
  };
};

export function ContourTide({
  colors = DEFAULT_COLORS,
  backgroundColor = "#000000",
  density = 1.1,
  particleSize = 1.35,
  waveHeight = 1.3,
  choppiness = 0.85,
  wavelength = 1.2,
  windAngle = 10,
  horizon = 0.2,
  fog = 1.1,
  glow = 0.65,
  foam = 1.45,
  speed = 0.75,
  interactive = true,
  parallax = 1.2,
  swell = 1.3,
  swellRadius = 1.1,
  clickRipples = true,
  seed = 0,
  paused = false,
  dpr = 1.5,
  className,
  style,
  children,
}: ContourTideProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isVisible, setIsVisible] = useState(true);

  // Monitor prefers-reduced-motion
  const prefersReduced = useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  // Intersection Observer to pause rendering when offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: "80px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Math.max(dpr, 0.5)));

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / Math.max(height, 1), 0.05, 200);
    camera.position.set(0, 1.35, 0);

    // Uniforms
    const uniforms = {
      uTime: { value: 0 },
      uNear: { value: 1.5 },
      uFar: { value: 36 },
      uSpread: { value: 0.85 },
      uSpreadBase: { value: 0.85 },
      uRows: { value: 380 },
      uColumns: { value: 1000 },
      uWave: { value: Array.from({ length: 14 }, () => new THREE.Vector4()) },
      uWaveMotion: { value: Array.from({ length: 14 }, () => new THREE.Vector4()) },
      uHeight: { value: 1 },
      uSun: { value: new THREE.Vector3(0.06, 0.07, -1).normalize() },
      uFogDistance: { value: 22 },
      uFoam: { value: 1 },
      uSize: { value: 0.006 },
      uFocal: { value: 900 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uGlow: { value: 1 },
      uCursor: { value: new THREE.Vector4(0, -8, 0, 0) },
      uCursorRadius: { value: 1.2 },
      uRipple: { value: Array.from({ length: 4 }, () => new THREE.Vector4()) },
      uTrough: { value: new THREE.Vector3() },
      uCrest: { value: new THREE.Vector3() },
      uInk: { value: 0 },
      uIntensity: { value: 1 },
    };

    // Initialize Wave System
    const initWaves = () => {
      const prng = createPrng(seed + 1.7);
      const radWind = degToRad(windAngle);
      const waveLen = clamp(wavelength, 0.2, 5);
      const l = 11 * waveLen;
      const s = 0.4 * waveLen;
      const chop = clamp(choppiness, 0, 1.5);
      let totalAmp = 0;
      const amps: number[] = [];

      for (let i = 0; i < 14; i++) {
        const factor = i / 13;
        const waveLengthVal = l * Math.pow(s / l, factor) * (0.85 + 0.3 * prng());
        const angle = radWind + (prng() - 0.5) * degToRad(150) * (0.45 + 0.55 * factor);
        const k = (2 * Math.PI) / waveLengthVal;
        const amp = 0.012 * Math.pow(waveLengthVal, 1.2) * (0.7 + 0.6 * prng());
        amps.push(amp);
        totalAmp += amp;
        uniforms.uWave.value[i].set(Math.sin(angle), Math.cos(angle), k, amp);
        uniforms.uWaveMotion.value[i].set(0.55 * Math.sqrt(9.8 * k), prng() * Math.PI * 2, 0, 0);
      }

      for (let i = 0; i < 14; i++) {
        const wave = uniforms.uWave.value[i];
        wave.w = 0.8 * (amps[i] / Math.max(totalAmp, 1e-5));
        const k = wave.z;
        uniforms.uWaveMotion.value[i].z = Math.min((0.9 * chop) / Math.max(k * wave.w * 14, 1e-4), 4);
      }
    };
    initWaves();

    // Particle Grid Geometry
    const clampedDensity = clamp(density, 0.3, 2);
    const cols = Math.round(1000 * clampedDensity);
    const rows = Math.round(380 * clampedDensity);
    const count = cols * rows;

    const grid = new Float32Array(2 * count);
    const jitter = new Float32Array(2 * count);
    const pos = new Float32Array(3 * count);
    const prng = createPrng(seed + 0.5);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        grid[2 * idx] = (x / (cols - 1)) * 2 - 1;
        grid[2 * idx + 1] = 1 - y / (rows - 1);
        jitter[2 * idx] = (prng() - 0.5) * 0.7;
        jitter[2 * idx + 1] = (prng() - 0.5) * 0.7;
      }
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    particlesGeo.setAttribute("aGrid", new THREE.BufferAttribute(grid, 2));
    particlesGeo.setAttribute("aJitter", new THREE.BufferAttribute(jitter, 2));
    particlesGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    // Occlusion Mesh Geometry (150x200 grid)
    const occGrid = new Float32Array(150 * 200 * 2);
    for (let y = 0; y < 150; y++) {
      for (let x = 0; x < 200; x++) {
        const idx = 200 * y + x;
        occGrid[2 * idx] = (x / 199) * 2 - 1;
        occGrid[2 * idx + 1] = y / 149;
      }
    }
    const occIndices: number[] = [];
    for (let y = 0; y < 149; y++) {
      for (let x = 0; x < 199; x++) {
        const a = 200 * y + x;
        const b = a + 1;
        const c = a + 200;
        const d = c + 1;
        occIndices.push(a, c, b, b, c, d);
      }
    }
    const occGeo = new THREE.BufferGeometry();
    occGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(150 * 200 * 3), 3));
    occGeo.setAttribute("aGrid", new THREE.BufferAttribute(occGrid, 2));
    occGeo.setIndex(occIndices);
    occGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    // Materials
    const occMaterial = new THREE.ShaderMaterial({
      vertexShader: OCCLUSION_VERTEX,
      fragmentShader: OCCLUSION_FRAGMENT,
      uniforms,
      colorWrite: false,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide,
    });
    const occMesh = new THREE.Mesh(occGeo, occMaterial);
    occMesh.frustumCulled = false;
    occMesh.renderOrder = 0;
    scene.add(occMesh);

    const particlesMaterial = new THREE.ShaderMaterial({
      vertexShader: PARTICLES_VERTEX,
      fragmentShader: PARTICLES_FRAGMENT,
      uniforms,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeo, particlesMaterial);
    particles.frustumCulled = false;
    particles.renderOrder = 1;
    scene.add(particles);

    // Color Setup
    const updateColors = () => {
      parseColorInto(uniforms.uTrough.value, colors[0] || DEFAULT_COLORS[0], DEFAULT_COLORS[0]);
      parseColorInto(uniforms.uCrest.value, colors[1] || DEFAULT_COLORS[1], DEFAULT_COLORS[1]);

      const transparent = isTransparent(backgroundColor);
      tempColor.set(transparent ? "#000000" : backgroundColor);
      const luminance = 0.2126 * tempColor.r + 0.7152 * tempColor.g + 0.0722 * tempColor.b;
      const isLight = !transparent && luminance > 0.35;

      uniforms.uInk.value = isLight ? 1 : 0;
      particlesMaterial.blending = THREE.CustomBlending;
      particlesMaterial.blendEquation = THREE.AddEquation;
      particlesMaterial.blendSrc = THREE.OneFactor;
      particlesMaterial.blendDst = isLight ? THREE.OneMinusSrcAlphaFactor : THREE.OneFactor;
      particlesMaterial.blendSrcAlpha = THREE.OneFactor;
      particlesMaterial.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
      particlesMaterial.needsUpdate = true;
    };
    updateColors();

    // Interaction State
    const pointer = { x: 0.5, y: 0.5, inside: false, presses: 0, pressX: 0.5, pressY: 0.5 };
    const state = {
      time: 30,
      lookX: 0,
      lookY: 0,
      cursorX: 0,
      cursorZ: -8,
      cursorLift: 0,
      seeded: false,
      presses: 0,
      ripples: Array.from({ length: 4 }, () => ({ x: 0, z: 0, age: 99 })),
      nextRipple: 0,
    };

    const raycaster = new THREE.Raycaster();
    const ndcPointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = new THREE.Vector3();

    // Global Pointer Listeners (attached to window so background reacts effortlessly)
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / Math.max(rect.width, 1);
      pointer.y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
      pointer.inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.pressX = (e.clientX - rect.left) / Math.max(rect.width, 1);
      pointer.pressY = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
      pointer.presses += 1;
    };

    const onPointerLeave = () => {
      pointer.inside = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });

    // Resize Handler
    const onResize = () => {
      if (!container || !canvas) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // Animation Loop
    let lastTime = performance.now();
    let animId = 0;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);

      if (!isVisible && !interactive) return;

      const delta = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
      lastTime = now;

      const isRunning = !paused && !prefersReduced && speed > 0;
      if (isRunning) {
        state.time += delta * clamp(speed, 0, 4);
      }

      const aspect = width / Math.max(height, 1);
      const halfFov = Math.tan(degToRad(50) / 2);
      const horizonAngle = Math.atan((1 - 2 * clamp(horizon, 0.02, 0.45)) * halfFov);
      const isInteractive = interactive && !prefersReduced && pointer.inside;

      const targetLookX = isInteractive ? (pointer.x - 0.5) * 2 : 0;
      const targetLookY = isInteractive ? (pointer.y - 0.5) * 2 : 0;
      const blend = 1 - Math.exp(-2.2 * delta);
      state.lookX += (targetLookX - state.lookX) * blend;
      state.lookY += (targetLookY - state.lookY) * blend;

      const prlx = clamp(parallax, 0, 3);
      camera.fov = 50;
      camera.near = 0.05;
      camera.far = 200;
      camera.aspect = aspect;
      camera.position.set(0.12 * state.lookX * prlx, 1.35 + 0.04 * Math.sin(0.35 * state.time), 0);
      camera.rotation.set(
        -horizonAngle + 0.025 * state.lookY * prlx,
        -0.045 * state.lookX * prlx,
        0.006 * Math.sin(0.27 * state.time),
        "YXZ"
      );
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      // Swell under pointer
      let swellActive = 0;
      if (isInteractive) {
        ndcPointer.set(2 * pointer.x - 1, 2 * pointer.y - 1);
        raycaster.setFromCamera(ndcPointer, camera);
        const hit = raycaster.ray.intersectPlane(plane, hitPoint);
        if (hit && hit.z < -0.5 && hit.z > -21.6) {
          if (!state.seeded) {
            state.cursorX = hit.x;
            state.cursorZ = hit.z;
            state.seeded = true;
          }
          const cursorBlend = 1 - Math.exp(-5 * delta);
          state.cursorX += (hit.x - state.cursorX) * cursorBlend;
          state.cursorZ += (hit.z - state.cursorZ) * cursorBlend;
          swellActive = 1;
        }
      }

      state.cursorLift +=
        (swellActive - state.cursorLift) * (1 - Math.exp(-delta * (swellActive > state.cursorLift ? 3 : 1.6)));
      if (state.cursorLift < 0.002 && !swellActive) {
        state.seeded = false;
      }

      // Ripples on click
      if (pointer.presses !== state.presses) {
        const countPress = Math.min(pointer.presses - state.presses, 4);
        state.presses = pointer.presses;
        if (clickRipples && !prefersReduced) {
          ndcPointer.set(2 * pointer.pressX - 1, 2 * pointer.pressY - 1);
          raycaster.setFromCamera(ndcPointer, camera);
          const hit = raycaster.ray.intersectPlane(plane, hitPoint);
          if (hit && hit.z < -0.5) {
            for (let a = 0; a < countPress; a++) {
              const r = state.ripples[state.nextRipple];
              r.x = hit.x;
              r.z = hit.z;
              r.age = 0;
              state.nextRipple = (state.nextRipple + 1) % 4;
            }
          }
        }
      }

      for (let i = 0; i < 4; i++) {
        const r = state.ripples[i];
        if (r.age < 6) r.age += delta;
        const amp = r.age < 6 ? Math.exp(-0.75 * r.age) : 0;
        uniforms.uRipple.value[i].set(r.x, r.z, 2.2 * r.age, amp);
      }

      // Update remaining uniform values
      const nearVal =
        (1.35 / Math.tan(horizonAngle + degToRad(50) / 2 + 0.025 * clamp(parallax, 0, 3) + 0.03)) * 0.8;
      uniforms.uTime.value = state.time;
      uniforms.uNear.value = nearVal;
      uniforms.uFar.value = 36;
      const spreadL = aspect * halfFov * 1.2;
      uniforms.uSpread.value = Math.cos(horizonAngle) * spreadL + Math.tan(0.06 * prlx);
      uniforms.uSpreadBase.value = 1.35 * Math.sin(horizonAngle) * spreadL + 0.14 * prlx + 0.35;
      uniforms.uRows.value = rows;
      uniforms.uColumns.value = cols;
      uniforms.uHeight.value = clamp(waveHeight, 0, 3);
      uniforms.uFogDistance.value = 140 / clamp(fog, 0.1, 4);
      uniforms.uFoam.value = clamp(foam, 0, 3);
      uniforms.uSize.value = 0.0028 * clamp(particleSize, 0.2, 4);
      uniforms.uFocal.value = height / 2 / halfFov;
      uniforms.uGlow.value = clamp(glow, 0, 2);
      uniforms.uCursor.value.set(state.cursorX, state.cursorZ, state.cursorLift * clamp(swell, 0, 3) * 0.14, 0);
      uniforms.uCursorRadius.value = clamp(swellRadius, 0.1, 5);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerleave", onPointerLeave);
      particlesGeo.dispose();
      occGeo.dispose();
      occMaterial.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, [
    colors,
    backgroundColor,
    density,
    particleSize,
    waveHeight,
    choppiness,
    wavelength,
    windAngle,
    horizon,
    fog,
    glow,
    foam,
    speed,
    interactive,
    parallax,
    swell,
    swellRadius,
    clickRipples,
    seed,
    paused,
    dpr,
    prefersReduced,
    isVisible,
  ]);

  const transparent = isTransparent(backgroundColor);

  return (
    <div
      ref={containerRef}
      className={cn("relative isolate overflow-hidden", className)}
      style={{
        backgroundColor: transparent ? undefined : backgroundColor,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none block"
        aria-hidden="true"
      />
      {children ? <div className="relative z-10 h-full w-full">{children}</div> : null}
    </div>
  );
}

export default ContourTide;

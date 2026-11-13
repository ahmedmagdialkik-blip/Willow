/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule, geoDistance } from 'd3-geo';
import * as topojson from 'topojson-client';

interface GlobeProps {
  className?: string;
}

export default function Globe({ className = '' }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  // Animation & rotation state refs (avoid React re-render overhead on 30fps ticks)
  const rotationRef = useRef<[number, number]>([-25, -20]);
  const velocityRef = useRef<[number, number]>([0.22, 0]); // slow continuous rotation
  const isDraggingRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const dotsRef = useRef<Array<[number, number]>>([]);
  const isVisibleRef = useRef<boolean>(false);
  const isTabActiveRef = useRef<boolean>(true);
  const animFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // 1. Load precomputed dots or calculate from topojson
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        // Attempt fast load from precomputed dots
        const res = await fetch('/data/globe-dots.json');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            dotsRef.current = data;
            setIsLoaded(true);
            return;
          }
        }
      } catch {
        /* fallback to topojson */
      }

      // Fallback: load topojson from local or CDN and extract dots
      try {
        let topoRes = await fetch('/data/land-110m.json');
        if (!topoRes.ok) {
          topoRes = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json');
        }
        if (topoRes.ok) {
          const topoData = (await topoRes.json()) as any;
          const landFeature = topojson.feature(topoData, topoData.objects.land) as any;
          const computedDots: Array<[number, number]> = [];
          const stepLat = 3.5;
          const { geoContains } = await import('d3-geo');

          for (let lat = -82; lat <= 82; lat += stepLat) {
            const cosLat = Math.cos((lat * Math.PI) / 180);
            const stepLon = Math.max(3.5, stepLat / Math.max(0.2, cosLat));
            for (let lon = -180; lon < 180; lon += stepLon) {
              if (geoContains(landFeature, [lon, lat])) {
                computedDots.push([Number(lon.toFixed(2)), Number(lat.toFixed(2))]);
              }
            }
          }
          if (!cancelled && computedDots.length > 0) {
            dotsRef.current = computedDots;
            setIsLoaded(true);
          }
        }
      } catch (err) {
        console.warn('Failed to load globe land geometry:', err);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. IntersectionObserver & Visibility handling: only animate when on screen and tab active
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(el);

    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 3. Canvas rendering loop (~30fps capped, ultra lightweight)
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create graticule generator
    const graticule = geoGraticule().step([30, 30]);
    const graticuleGeo = graticule();

    // Create projection
    const projection = geoOrthographic().clipAngle(90);

    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    function render(currentTime: number) {
      animFrameIdRef.current = requestAnimationFrame(render);

      // Only render if visible and tab is active
      if (!isVisibleRef.current || !isTabActiveRef.current) return;

      const elapsed = currentTime - lastFrameTimeRef.current;
      if (elapsed < FRAME_INTERVAL) return;
      lastFrameTimeRef.current = currentTime - (elapsed % FRAME_INTERVAL);

      const activeCanvas = canvasRef.current;
      if (!activeCanvas) return;
      const activeCtx = activeCanvas.getContext('2d', { alpha: true });
      if (!activeCtx) return;

      const width = activeCanvas.clientWidth || 400;
      const height = activeCanvas.clientHeight || 400;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Resize canvas buffer if necessary
      if (activeCanvas.width !== Math.floor(width * dpr) || activeCanvas.height !== Math.floor(height * dpr)) {
        activeCanvas.width = Math.floor(width * dpr);
        activeCanvas.height = Math.floor(height * dpr);
      }

      activeCtx.save();
      activeCtx.scale(dpr, dpr);
      activeCtx.clearRect(0, 0, width, height);

      const radius = Math.min(width, height) * 0.44;
      const cx = width / 2;
      const cy = height / 2;

      // Update rotation
      if (!isDraggingRef.current) {
        rotationRef.current[0] += velocityRef.current[0];
        rotationRef.current[1] += velocityRef.current[1];
        // Decay secondary vertical velocity
        velocityRef.current[1] *= 0.94;
        // Restore standard slow auto-spin if inertia drops
        if (Math.abs(velocityRef.current[0] - 0.22) > 0.01) {
          velocityRef.current[0] = velocityRef.current[0] * 0.95 + 0.22 * 0.05;
        }
      }

      // Clamp vertical tilt between -60° and +60°
      rotationRef.current[1] = Math.max(-60, Math.min(60, rotationRef.current[1]));

      projection
        .scale(radius)
        .translate([cx, cy])
        .rotate([rotationRef.current[0], rotationRef.current[1], 0]);

      // 1. Draw outer circular globe boundary (faint outline)
      activeCtx.beginPath();
      activeCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      activeCtx.strokeStyle = 'rgba(237, 230, 202, 0.20)';
      activeCtx.lineWidth = 1;
      activeCtx.stroke();

      // 2. Draw light graticule lines
      activeCtx.beginPath();
      const pathGenerator = geoPath(projection, activeCtx);
      pathGenerator(graticuleGeo);
      activeCtx.strokeStyle = 'rgba(237, 230, 202, 0.07)';
      activeCtx.lineWidth = 0.75;
      activeCtx.stroke();

      // 3. Draw dotted land grid (cream dots ~3px diameter)
      const dots = dotsRef.current;
      const centerLonLat: [number, number] = [-rotationRef.current[0], -rotationRef.current[1]];
      const dotRadius = 1.35; // ~2.7px diameter
      const halfPi = Math.PI / 2;

      activeCtx.beginPath();
      activeCtx.fillStyle = '#ede6ca';

      for (let i = 0; i < dots.length; i++) {
        const pt = dots[i];
        // Quick hemisphere visibility check
        if (geoDistance(centerLonLat, pt) < halfPi - 0.02) {
          const coords = projection(pt);
          if (coords) {
            activeCtx.moveTo(coords[0] + dotRadius, coords[1]);
            activeCtx.arc(coords[0], coords[1], dotRadius, 0, Math.PI * 2);
          }
        }
      }
      activeCtx.fill();

      activeCtx.restore();
    }

    lastFrameTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isLoaded]);

  // 4. Mouse / Touch Dragging with velocity inertia (touch-action: pan-y preserves vertical scrolling)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    setIsInteracting(true);
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !lastPointerRef.current) return;

    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    const now = performance.now();
    const dt = Math.max(1, now - lastPointerRef.current.time);

    // Update rotation: drag right rotates globe eastward, drag down tilts down
    const sensitivity = 0.45;
    rotationRef.current[0] += dx * sensitivity;
    rotationRef.current[1] -= dy * sensitivity;

    // Track instant velocity for smooth release inertia
    velocityRef.current = [dx * 0.4, -dy * 0.3];

    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsInteracting(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-[520px] aspect-square mx-auto flex flex-col items-center justify-center select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{
          touchAction: 'pan-y', // Touch dragging will not hijack vertical scrolling
          maxWidth: '520px',
          maxHeight: '520px',
        }}
        aria-label="Interactive dotted globe representation of world diplomacy. Drag horizontally to rotate."
      />

      {/* Floating subtle interaction hint */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-xs text-[#b9b296]/80 tracking-wide font-normal transition-opacity duration-300 ${
          isInteracting ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span>Drag to rotate</span>
      </div>
    </div>
  );
}

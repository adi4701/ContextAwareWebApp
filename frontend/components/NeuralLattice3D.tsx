'use client';

import React, { useEffect, useRef } from 'react';
import { useAdaptationStore } from '../store/adaptationStore';
import { useTelemetryStore } from '../store/telemetryStore';

interface Node3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  radius: number;
}

export default function NeuralLattice3D({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeState = useAdaptationStore((s) => s.state);
  const confidence = useAdaptationStore((s) => s.confidence);
  const clicks = useTelemetryStore((s) => s.cumulativeClicks);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 300);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate 3D sphere points (Fibonacci Sphere algorithm)
    const numPoints = 42;
    const radius = Math.min(width, height) * 0.38;
    const nodes: Node3D[] = [];

    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      nodes.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        baseX: x * radius,
        baseY: y * radius,
        baseZ: z * radius,
        radius: 2 + Math.random() * 2,
      });
    }

    let angleX = 0;
    let angleY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - width / 2) * 0.0003;
      mouseY = (e.clientY - rect.top - height / 2) * 0.0003;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    // Color thematic mapping based on behavior state
    const getStateColor = (opacity: number) => {
      switch (activeState) {
        case 'fast_navigator':
        case 'power_user':
          return `rgba(99, 102, 241, ${opacity})`; // Indigo
        case 'reader':
        case 'deep_reader':
          return `rgba(217, 119, 6, ${opacity})`; // Amber
        case 'struggling':
        case 'assistive_mode':
          return `rgba(239, 68, 68, ${opacity})`; // Coral red
        case 'explorer':
        case 'fast_scanner':
          return `rgba(16, 185, 129, ${opacity})`; // Cyber emerald
        default:
          return `rgba(16, 185, 129, ${opacity})`;
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Rotation velocity modulated by confidence and clicks
      angleY += 0.004 + mouseX;
      angleX += 0.002 + mouseY;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const projected: Array<{ x: number; y: number; z: number; r: number }> = [];

      // Rotate and project points
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Rotate Y
        let x1 = node.baseX * cosY - node.baseZ * sinY;
        let z1 = node.baseZ * cosY + node.baseX * sinY;

        // Rotate X
        let y2 = node.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.baseY * sinX;

        // Perspective projection
        const focalLength = 400;
        const scale = focalLength / (focalLength + z2);
        const projX = width / 2 + x1 * scale;
        const projY = height / 2 + y2 * scale;

        projected.push({
          x: projX,
          y: projY,
          z: z2,
          r: Math.max(1, node.radius * scale),
        });
      }

      // Draw connecting lattice edges
      ctx.lineWidth = 0.75;
      const maxDist = radius * 0.95;

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < maxDist) {
            const edgeAlpha = (1 - dist / maxDist) * 0.28;
            ctx.strokeStyle = getStateColor(edgeAlpha);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const alpha = Math.max(0.2, (p.z + radius) / (radius * 2));

        // Node Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        grad.addColorStop(0, getStateColor(alpha * 0.9));
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Node Core
        ctx.fillStyle = getStateColor(alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeState, confidence, clicks]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
    </div>
  );
}

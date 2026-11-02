'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  depth?: number; // tilt strength (default 10)
}

export default function TiltCard({
  children,
  className = '',
  onClick,
  onMouseEnter,
  onMouseLeave,
  depth = 10,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  const rotateX = useTransform(mouseYSpring, [0, 1], [depth, -depth]);
  const rotateY = useTransform(mouseXSpring, [0, 1], [-depth, depth]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onMouseEnter) onMouseEnter();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
    if (onMouseLeave) onMouseLeave();
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="perspective-1000 relative"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? 1.015 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={`relative rounded-3xl overflow-hidden glass-card transition-colors duration-300 ${className}`}
      >
        {/* Dynamic Specular Spotlight Sheen */}
        {isHovered && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 opacity-70 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 280px at ${x.get() * 100}% ${y.get() * 100}%, rgba(16, 185, 129, 0.12), transparent 80%)`,
            }}
          />
        )}

        <div className="relative z-10">{children}</div>
      </motion.div>
    </div>
  );
}

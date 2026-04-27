"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import clsx from "clsx";

type Props = {
  children?: ReactNode;
  className?: string;
  // Parallax intensity multiplier (max travel = 6px * depth on each axis)
  depth?: number;
  // Entrance stagger order (higher = later)
  index?: number;
};

export default function GlassPanel({
  children,
  className,
  depth = 1,
  index = 0,
}: Props) {
  // Outer holds the entrance animation (opacity + translateY).
  // Inner holds the parallax (translateX/Y). Splitting them avoids transform
  // contention between the two animations.
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set(outer, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        outer,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          delay: index * 0.08,
          ease: "power3.out",
        },
      );
    });

    if (reduceMotion) {
      return () => ctx.revert();
    }

    // Per-frame parallax setters — gsap.quickTo writes directly to the
    // transform style, no React state, no per-pointer-event re-renders.
    const setX = gsap.quickTo(inner, "x", { duration: 0.6, ease: "power2.out" });
    const setY = gsap.quickTo(inner, "y", { duration: 0.6, ease: "power2.out" });

    const handler = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      const max = 6 * depth;
      setX(nx * max);
      setY(ny * max);
    };
    window.addEventListener("mousemove", handler, { passive: true });

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", handler);
    };
  }, [depth, index]);

  return (
    <div ref={outerRef} style={{ opacity: 0 }}>
      <div ref={innerRef} className={clsx("glass-panel", className)}>
        {children}
      </div>
    </div>
  );
}

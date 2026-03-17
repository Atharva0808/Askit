"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
} from "motion/react";
import { wrap } from "motion";
import { cn } from "@/lib/utils";

interface VelocityScrollProps {
  text: string;
  defaultVelocity?: number;
  className?: string;
  direction?: "left" | "right";
}

export function VelocityScroll({
  text,
  defaultVelocity = 5,
  className,
  direction = "left",
}: VelocityScrollProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const x = useTransform(baseX, (v: number) => `${wrap(-20, -45, v)}%`);

  const dirSign = direction === "right" ? -1 : 1;
  const directionFactor = useRef<number>(dirSign);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * defaultVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1 * dirSign;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = dirSign;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div
      className={cn(
        "neo-velocity-mask relative w-full overflow-hidden flex whitespace-nowrap leading-none bg-transparent",
        className
      )}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <motion.div className="flex whitespace-nowrap gap-8 w-max" style={{ x } as any}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="block text-3xl sm:text-5xl md:text-7xl font-black uppercase text-white/[0.07] tracking-tighter select-none">
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

"use client";

import { motion, useScroll, useSpring } from "motion/react";

export function ScrollIndicator() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.01,
  });

  return (
    <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none select-none">
      {/* Label */}
      <div 
        className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-semibold opacity-0 sm:opacity-100 transition-opacity duration-500"
        style={{ writingMode: "vertical-rl" }}
      >
        Discover
      </div>
      
      {/* Track */}
      <div className="h-32 sm:h-48 w-[2px] bg-white/5 rounded-full relative overflow-hidden backdrop-blur-sm shadow-[inset_0_0_4px_rgba(0,0,0,0.4)]">
        {/* Progress Bar */}
        <motion.div
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-neo-pink to-neo-pink-dim origin-top rounded-full shadow-[0_0_15px_rgba(236,72,153,0.3)]"
          style={{ scaleY, height: "100%" }}
        />
      </div>

      {/* Pulsing Dot indicating more content */}
      <motion.div 
        animate={{ 
          y: [0, 10, 0],
          opacity: [0.2, 0.6, 0.2]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-1.5 h-1.5 rounded-full bg-neo-pink shadow-[0_0_10px_rgba(236,72,153,0.5)]"
      />
    </div>
  );
}

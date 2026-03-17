"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "Rag-powered memory",
    desc: "Upload docs, PDFs, and websites for grounded answers.",
    gif: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2d3a2txODhxY3pzam54aW12eTZsY3U0dWczdXNvbGlxbXVvdTU0cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/rY93u9tQbybks/giphy.gif", // Matrix Download
  },
  {
    title: "Multimodal vision",
    desc: "Attach images, screenshots, or diagrams to chat.",
    gif: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHV5ZmI0b3JxNWM1MTM1eTFob2lscXNqNDVqOWk3cGU3OTFlaDVwNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GpyS1lJXJYupG/giphy.gif", // Jurassic Park Glasses
  },
  {
    title: "Agentic AI",
    desc: "The AI calls tools on-demand — search, fetch, MCP.",
    gif: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXVoa3ZzdHNlZzkwdm44YTB2YWhtbXp4bXgxcHZnYno3MjRwa29odyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/syEfLvksYQnmM/giphy.gif", // Brad Pitt meme
  },
];

export function FeatureSection({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {FEATURES.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.12 }}
          className="relative h-[300px] w-full rounded-3xl overflow-hidden group cursor-pointer border border-white/10 bg-[#0c0c0e]"
        >
          {/* Background Image (GIF) always visible but visually appealing */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-70"
            style={{
              backgroundImage: `url(${f.gif})`,
            }}
          />
          {/* Default dark overlay, lightening a bit on hover */}
          <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500" />

          {/* Text Content */}
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <h3
              className="text-xl font-bold text-white mb-2 tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700 }}
            >
              {f.title}
            </h3>
            <p className="text-sm text-gray-200">
              {f.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

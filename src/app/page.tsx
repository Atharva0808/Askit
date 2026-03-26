import Link from "next/link";
import { FeatureSection } from "@/components/ui/feature-section";
import { VelocityScroll } from "@/components/ui/velocity-scroll";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";

function SakuraIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f9a8d4"/>
          <stop offset="100%" stopColor="#ec4899"/>
        </radialGradient>
      </defs>
      <g transform="translate(32,32)">
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg)" opacity="0.9"/>
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg)" opacity="0.9" transform="rotate(60)"/>
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg)" opacity="0.9" transform="rotate(120)"/>
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg)" opacity="0.9" transform="rotate(180)"/>
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg)" opacity="0.9" transform="rotate(240)"/>
        <ellipse cx="0" cy="-12" rx="7" ry="12" fill="url(#sg)" opacity="0.9" transform="rotate(300)"/>
        <circle cx="0" cy="0" r="4" fill="#fbbf24" opacity="0.8"/>
      </g>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neo-black text-neo-white overflow-x-hidden">
      <ScrollIndicator />
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 md:px-12">
        <div className="flex items-center gap-2">
          <SakuraIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          <span
            className="text-lg tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700, color: "var(--neo-pink)" }}
          >
            Askit
          </span>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors active:scale-[0.97] touch-manipulation">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10 sm:pb-14 md:pt-28 md:px-8">
        <div className="text-center mb-10 sm:mb-16">
          <h1
            className="text-4xl sm:text-5xl md:text-7xl leading-[1.1] mb-4 sm:mb-6 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700 }}
          >
            <span className="text-neo-white">Ask anything.</span>
            <br />
            <span style={{ color: "var(--neo-pink)" }}>Get answers.</span>
          </h1>
          <p className="text-white/40 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            RAG-powered, multimodal AI with agentic tools. Upload documents,
            ask with text, images or voice, and get accurate answers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-white text-black font-semibold rounded-2xl hover:bg-gray-100 hover:scale-105 transition-all outline-none active:scale-[0.97] touch-manipulation text-center"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 font-medium rounded-2xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors text-center active:scale-[0.97] touch-manipulation"
            >
              I have an account
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mb-10 sm:mb-14">
          <FeatureSection />
        </div>

        {/* Velocity Scroll - two directions, white text, no borders */}
        <div className="mb-6 sm:mb-8 -mx-4 sm:-mx-6 md:-mx-8 overflow-hidden space-y-2">
          <VelocityScroll text="ASK ANYTHING  •  GET ANSWERS  •  RAG POWERED  •  MULTIMODAL  •  AGENTIC AI  •  " defaultVelocity={1} direction="left" />
          <VelocityScroll text="VOICE INPUT  •  DOCUMENT SEARCH  •  WEB FETCH  •  MCP TOOLS  •  PLUGINS  •  " defaultVelocity={1} direction="right" />
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.04] py-5 sm:py-6 px-4 sm:px-6 text-center text-white/20 text-xs">
        &copy; 2026 Askit.
      </footer>
    </div>
  );
}

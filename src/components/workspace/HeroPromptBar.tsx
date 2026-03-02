import { useState } from "react";
import { Zap } from "lucide-react";
import heroImg from "@/assets/hero-mountains.jpg";

const HeroPromptBar = () => {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: 400 }}>
      {/* Background image with overlay */}
      <div className="absolute left-0 top-0 w-full h-[400px]">
        <img
          src={heroImg}
          alt="Mountain landscape"
          className="h-full w-full object-cover"
        />
        {/* Dark overlay matching spec: rgba(0,0,0,0.2) uniform */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2))" }} />
        {/* Bottom fade to workspace panel */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-workspace-panel" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-16 sm:py-24 md:py-32">
        <h1 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-workspace-surface-foreground sm:text-4xl md:text-5xl lg:text-[56px]">
          Idea Blooms Into Form
        </h1>

        {/* Prompt input */}
        <div className="relative w-full max-w-[760px]">
          <div className="flex items-center rounded-2xl border border-workspace-border/30 bg-[hsl(var(--workspace-glass))] backdrop-blur-xl shadow-[0_0_30px_hsl(var(--workspace-glow))]">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入您的提示词，比如：可爱的猫"
              className="flex-1 bg-transparent px-5 py-4 text-sm text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/40 focus:outline-none sm:text-base"
            />
            <button className="mr-2 flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 shadow-[0_0_16px_hsl(var(--workspace-glow))]">
              Generate
              <Zap className="h-3.5 w-3.5" />
              <span className="text-primary-foreground/70">5</span>
            </button>
          </div>
          {/* Subtle glow under input */}
          <div className="absolute -bottom-4 left-1/2 h-8 w-2/3 -translate-x-1/2 rounded-full bg-workspace-neon/5 blur-2xl" />
        </div>
      </div>
    </div>
  );
};

export default HeroPromptBar;

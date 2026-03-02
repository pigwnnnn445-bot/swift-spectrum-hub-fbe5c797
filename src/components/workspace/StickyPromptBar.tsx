import { useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StickyPromptBarProps {
  visible: boolean;
}

const StickyPromptBar = ({ visible }: StickyPromptBarProps) => {
  const [prompt, setPrompt] = useState("");

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="bg-workspace-panel/90 backdrop-blur-xl border-b border-workspace-border/30 shadow-lg">
        {/* Use same horizontal padding as gallery section so widths align */}
        <div className="px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center rounded-2xl border border-workspace-border/30 bg-[hsl(var(--workspace-glass))] backdrop-blur-xl shadow-[0_0_20px_hsl(var(--workspace-glow))]">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入您的提示词，比如：可爱的猫"
              className="flex-1 bg-transparent px-5 py-3 text-sm text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/40 focus:outline-none"
            />
            <button className="mr-2 flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 shadow-[0_0_16px_hsl(var(--workspace-glow))]">
              Generate
              <Zap className="h-3.5 w-3.5" />
              <span className="text-primary-foreground/70">5</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyPromptBar;

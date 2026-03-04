import { useRef, useEffect, useCallback } from "react";
import { Zap } from "lucide-react";

interface HeroPromptBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  cost: number;
  isGenerating?: boolean;
  onSubmit?: () => void;
}

const useAutoResize = (value: string, maxHeight: number) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [maxHeight]);

  useEffect(() => { resize(); }, [value, resize]);

  return ref;
};

const HeroPromptBar = ({ prompt, onPromptChange, cost, isGenerating, onSubmit }: HeroPromptBarProps) => {
  const textareaRef = useAutoResize(prompt, 220);

  return (
    <div className="relative w-full bg-workspace-panel">
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <h1 className="mb-8 text-center text-4xl font-black tracking-wide text-workspace-surface-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          把想象，变成图像
        </h1>

        <div className="relative w-full max-w-[760px]">
          <div className="flex items-end rounded-2xl border border-workspace-border/60 bg-workspace-surface shadow-lg">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="输入您的提示词，比如：可爱的猫"
              rows={1}
              className="prompt-textarea flex-1 resize-none bg-transparent px-5 py-4 text-sm text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/50 focus:outline-none sm:text-base"
              style={{ maxHeight: 220, minHeight: 100 }}
            />
            <button
              disabled={!prompt.trim() || isGenerating}
              onClick={onSubmit}
              className="mr-2 mb-2 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-workspace-neon px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 shadow-md shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isGenerating ? "生成中..." : "发送"}
              <Zap className="h-3.5 w-3.5" />
              <span className="text-white/70">{cost}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroPromptBar;

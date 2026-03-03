import { useRef, useEffect, useCallback } from "react";
import { Zap } from "lucide-react";
import heroImg from "@/assets/hero-mountains.jpg";

interface HeroPromptBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  cost: number;
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

const HeroPromptBar = ({ prompt, onPromptChange, cost }: HeroPromptBarProps) => {
  const textareaRef = useAutoResize(prompt, 440);

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: 400 }}>
      <div className="absolute left-0 top-0 w-full h-[500px]">
        <img src={heroImg} alt="Mountain landscape" className="h-[500px] w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2))" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-workspace-surface" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-16 sm:py-24 md:py-32">
        <h1 className="mb-8 text-center text-4xl font-black tracking-wide text-workspace-surface-foreground sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg">
          把想象，变成图像
        </h1>

        <div className="relative w-full max-w-[760px]">
          <div className="flex items-end rounded-2xl border border-workspace-border/30 bg-[hsl(var(--workspace-glass))] backdrop-blur-xl shadow-[0_0_30px_hsl(var(--workspace-glow))]">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="输入您的提示词，比如：可爱的猫"
              rows={1}
              className="prompt-textarea flex-1 resize-none bg-transparent px-5 py-4 text-sm text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/40 focus:outline-none sm:text-base"
              style={{ maxHeight: 440, minHeight: 200 }}
            />
            <button className="mr-2 mb-2 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-workspace-neon px-5 py-2.5 text-sm font-medium text-workspace-surface-foreground transition-all hover:brightness-110 shadow-[0_0_16px_hsl(var(--workspace-glow))] shrink-0">
              发送
              <Zap className="h-3.5 w-3.5" />
              <span className="text-primary-foreground/70">{cost}</span>
            </button>
          </div>
          <div className="absolute -bottom-4 left-1/2 h-8 w-2/3 -translate-x-1/2 rounded-full bg-workspace-neon/5 blur-2xl" />
        </div>
      </div>
    </div>
  );
};

export default HeroPromptBar;

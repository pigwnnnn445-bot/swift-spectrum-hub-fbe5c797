import { useRef, useEffect, useCallback, useState, type RefObject } from "react";
import { Sparkles } from "lucide-react";
import PromptGeneratorModal from "./PromptGeneratorModal";
import PromptOptimizerModal from "./PromptOptimizerModal";


interface HeroPromptBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  cost: number;
  isSubmitDisabled?: boolean;
  onSubmit?: () => void;
  hasActiveTask?: boolean;
  /** 外部 ref，用于聚焦输入框 */
  promptInputRef?: RefObject<HTMLTextAreaElement | null>;
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

const HeroPromptBar = ({ prompt, onPromptChange, cost, isSubmitDisabled, onSubmit, hasActiveTask, promptInputRef }: HeroPromptBarProps) => {
  const autoRef = useAutoResize(prompt, 220);
  const [genOpen, setGenOpen] = useState(false);
  const [optOpen, setOptOpen] = useState(false);
  const [seed, setSeed] = useState("");

  // Merge internal auto-resize ref with external ref
  const setRefs = useCallback((el: HTMLTextAreaElement | null) => {
    (autoRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    if (promptInputRef) {
      (promptInputRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    }
  }, [autoRef, promptInputRef]);

  const handleOptimize = (s: string) => {
    setSeed(s);
    setGenOpen(false);
    setOptOpen(true);
  };

  const handleApply = (text: string) => {
    onPromptChange(text);
    setOptOpen(false);
    requestAnimationFrame(() => {
      const el = autoRef.current;
      if (el) { el.focus(); el.setSelectionRange(text.length, text.length); }
    });
  };

  return (
    <>
      <div className={`relative w-full bg-workspace-panel ${hasActiveTask ? "sticky top-[41px] z-40" : ""}`}>
        <div className={`relative z-10 flex flex-col items-center justify-center px-4 ${hasActiveTask ? "py-2.5 sm:py-2.5" : "py-12 sm:py-16"}`}>
          {/* 引导文案：生成中时隐藏 */}
          {!hasActiveTask && (
            <h1 className="mb-8 text-center text-4xl font-black tracking-wide text-workspace-surface-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              把想象，变成图像
            </h1>
          )}

          <div className={`relative w-full ${hasActiveTask ? "" : "max-w-[760px]"}`}>
            <div className="flex flex-col rounded-2xl border border-workspace-border/60 bg-workspace-surface shadow-lg">
              <textarea
                ref={setRefs}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="输入您的提示词，比如：可爱的猫"
                rows={1}
                className="prompt-textarea w-full resize-none bg-transparent px-5 py-4 text-sm text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/50 focus:outline-none sm:text-base"
                style={{ maxHeight: 220, minHeight: 100 }}
              />
              <div className="flex items-center justify-end gap-2 px-3 pb-3">
                <button
                  onClick={() => setGenOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 h-8 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">提示词生成器</span>
                </button>
                <button
                  disabled={isSubmitDisabled || !prompt.trim()}
                  onClick={onSubmit}
                  className="inline-flex items-center justify-center whitespace-nowrap transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-gradient-to-r from-primary to-workspace-neon h-8 w-8 sm:w-auto sm:px-3 text-sm font-bold rounded-full text-white gap-1"
                >
                  <span className="hidden sm:inline">发送</span>
                  <span>⚡</span>
                  <span className="hidden sm:inline text-white/70">{cost}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PromptGeneratorModal open={genOpen} onClose={() => setGenOpen(false)} onOptimize={handleOptimize} />
      <PromptOptimizerModal open={optOpen} seed={seed} onClose={() => setOptOpen(false)} onApply={handleApply} />
    </>
  );
};

export default HeroPromptBar;

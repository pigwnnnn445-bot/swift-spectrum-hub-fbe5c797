import { useRef, useEffect, useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import PromptGeneratorModal from "./PromptGeneratorModal";
import PromptOptimizerModal from "./PromptOptimizerModal";

interface StickyPromptBarProps {
  visible: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  cost: number;
  isSubmitDisabled?: boolean;
  onSubmit?: () => void;
  children?: React.ReactNode;
}

const useAutoResize = (value: string) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(100, el.scrollHeight) + "px";
  }, []);

  useEffect(() => { resize(); }, [value, resize]);

  return ref;
};

const StickyPromptBar = ({ visible, prompt, onPromptChange, cost, isSubmitDisabled, onSubmit, children }: StickyPromptBarProps) => {
  const textareaRef = useAutoResize(prompt);
  const [genOpen, setGenOpen] = useState(false);
  const [optOpen, setOptOpen] = useState(false);
  const [seed, setSeed] = useState("");
  // Track whether we should render at all (delayed unmount for exit animation)
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      // Delay unmount to allow exit animation
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleOptimize = (s: string) => {
    setSeed(s);
    setGenOpen(false);
    setOptOpen(true);
  };

  const handleApply = (text: string) => {
    onPromptChange(text);
    setOptOpen(false);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) { el.focus(); el.setSelectionRange(text.length, text.length); }
    });
  };

  if (!shouldRender) return null;

  return (
    <>
      <div
        className={cn(
          "w-full sticky top-[41px] z-40 transition-all duration-200 ease-out",
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <div className="bg-workspace-panel/95 backdrop-blur-xl border-b border-workspace-border/60 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex items-end rounded-2xl border border-workspace-border/60 bg-workspace-surface shadow-sm min-w-0">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="输入您的提示词，比如：可爱的猫"
                rows={1}
                className="prompt-textarea flex-1 min-w-0 resize-none bg-transparent px-5 py-4 text-sm text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/40 focus:outline-none overflow-y-auto max-h-[min(260px,calc(100dvh-260px))] md:max-h-[220px]"
                style={{ minHeight: 100, wordBreak: "break-word", overflowWrap: "break-word" }}
              />
              <div className="flex items-center gap-2 mr-2 mb-2 shrink-0">
                <button
                  onClick={() => setGenOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] px-3 h-8 text-sm rounded-full text-muted-foreground border border-workspace-border hover:bg-workspace-chip hover:text-foreground transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">提示词生成器</span>
                </button>
                <button
                  disabled={!prompt.trim() || isSubmitDisabled}
                  onClick={onSubmit}
                  className="inline-flex items-center justify-center whitespace-nowrap transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-gradient-to-r from-primary to-workspace-neon h-8 w-8 sm:w-auto sm:px-3 text-sm font-bold rounded-full text-white gap-1"
                >
                  <span className="hidden sm:inline">发送</span>
                  <span>⚡</span>
                  <span className="hidden sm:inline text-white/70">{cost}</span>
                </button>
              </div>
            </div>
            {children && <div className="mt-1">{children}</div>}
          </div>
        </div>
      </div>

      <PromptGeneratorModal open={genOpen} onClose={() => setGenOpen(false)} onOptimize={handleOptimize} />
      <PromptOptimizerModal open={optOpen} seed={seed} onClose={() => setOptOpen(false)} onApply={handleApply} />
    </>
  );
};

export default StickyPromptBar;

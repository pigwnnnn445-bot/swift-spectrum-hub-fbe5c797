import { useRef, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StickyPromptBarProps {
  visible: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  cost: number;
  isSubmitDisabled?: boolean;
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

const StickyPromptBar = ({ visible, prompt, onPromptChange, cost, isSubmitDisabled, onSubmit }: StickyPromptBarProps) => {
  const textareaRef = useAutoResize(prompt, 240);

  if (!visible) return null;

  return (
    <div className="w-full">
      <div className="bg-workspace-panel/95 backdrop-blur-xl border-b border-workspace-border/60 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-end rounded-2xl border border-workspace-border/60 bg-workspace-surface shadow-sm">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="输入您的提示词，比如：可爱的猫"
              rows={1}
            className="prompt-textarea flex-1 resize-none bg-transparent px-5 py-4 text-sm text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/40 focus:outline-none"
              style={{ maxHeight: 220, minHeight: 100 }}
            />
            <button
              disabled={!prompt.trim() || isSubmitDisabled}
              onClick={onSubmit}
              className="inline-flex items-center justify-center whitespace-nowrap transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-gradient-to-r from-primary to-workspace-neon h-8 w-8 sm:w-auto sm:px-3 text-sm font-bold rounded-full text-white gap-1 mr-2 mb-2"
            >
              <span className="hidden sm:inline">发送</span>
              <span>⚡</span>
              <span className="hidden sm:inline text-white/70">{cost}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyPromptBar;

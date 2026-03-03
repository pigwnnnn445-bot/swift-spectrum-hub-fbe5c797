import { useRef, useEffect, useCallback } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StickyPromptBarProps {
  visible: boolean;
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

const StickyPromptBar = ({ visible, prompt, onPromptChange, cost }: StickyPromptBarProps) => {
  const textareaRef = useAutoResize(prompt, 240);

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 overflow-hidden",
        visible ? "opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}
    >
      <div className="bg-workspace-panel/95 backdrop-blur-xl border-b border-workspace-border/60 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-end rounded-2xl border border-workspace-border/60 bg-workspace-surface shadow-sm">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="输入您的提示词，比如：可爱的猫"
              rows={1}
              className="prompt-textarea flex-1 resize-none bg-transparent px-5 py-3 text-sm text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/40 focus:outline-none"
              style={{ maxHeight: 240, minHeight: 60 }}
            />
            <button className="mr-2 mb-1.5 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-workspace-neon px-5 py-2 text-sm font-medium text-workspace-surface-foreground transition-all hover:brightness-110 shadow-[0_0_16px_hsl(var(--workspace-glow))] shrink-0">
              发送
              <Zap className="h-3.5 w-3.5" />
              <span className="text-primary-foreground/70">{cost}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyPromptBar;

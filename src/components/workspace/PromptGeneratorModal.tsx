import { useState, useRef, useEffect, useCallback } from "react";
import { X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface PromptGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when user clicks 优化, passes the seed text to open Step 2 */
  onOptimize: (seed: string) => void;
}

const PromptGeneratorModal = ({ open, onClose, onOptimize }: PromptGeneratorModalProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setInput("");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const handleOptimize = useCallback(() => {
    const seed = input.trim();
    if (!seed) return;
    onOptimize(seed);
  }, [input, onOptimize]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="z-[250]" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[250] w-[90vw] max-w-lg flex flex-col bg-background border border-border rounded-2xl shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onPointerDownOutside={() => onClose()}
        >
          <DialogTitle className="sr-only">提示生成器</DialogTitle>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">提示生成器</h3>
              <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex-1">
            <div className="relative rounded-xl bg-muted/40 border border-border">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的提示，例如：可爱的猫"
                className="w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                style={{ minHeight: 200, maxHeight: 320 }}
                rows={6}
              />
              <div className="flex justify-end px-3 pb-3">
                <button
                  onClick={handleOptimize}
                  disabled={!input.trim()}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  优化
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default PromptGeneratorModal;

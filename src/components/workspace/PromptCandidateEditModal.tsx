import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface PromptCandidateEditModalProps {
  open: boolean;
  /** 1-based index for display badge */
  index: number;
  initialText: string;
  onClose: () => void;
  /** Called with the optimized text when user clicks 生成 */
  onGenerate: (newText: string) => void;
}

const PromptCandidateEditModal = ({ open, index, initialText, onClose, onGenerate }: PromptCandidateEditModalProps) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, initialText]);

  const handleGenerate = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Mock: append a short expansion
    const expanded = trimmed + "，画面细节丰富，光影层次分明，呈现出极致的视觉美感与深邃的意境。";
    onGenerate(expanded);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="z-[260]" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[260] w-[90vw] max-w-lg flex flex-col bg-background border border-border rounded-2xl shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onPointerDownOutside={() => onClose()}
        >
          <DialogTitle className="sr-only">提示生成器 - 编辑候选</DialogTitle>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">提示生成器</h3>
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                {index}
              </span>
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
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="编辑提示词..."
                className="w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                style={{ minHeight: 200, maxHeight: 320 }}
                rows={6}
              />
              <div className="flex justify-end px-3 pb-3">
                <button
                  onClick={handleGenerate}
                  disabled={!text.trim()}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  生成
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default PromptCandidateEditModal;

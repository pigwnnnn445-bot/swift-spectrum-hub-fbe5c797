import { useState, useRef, useEffect, useCallback } from "react";
import { X, AlertCircle, Pencil, RefreshCw } from "lucide-react";
import PromptCandidateEditModal from "./PromptCandidateEditModal";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface PromptOptimizerModalProps {
  open: boolean;
  seed: string;
  onClose: () => void;
  /** Called when user clicks 优化 in step 2 — passes the final prompt text */
  onApply: (text: string) => void;
}

/* ── mock candidate generator ── */
const SUFFIXES = [
  "，在夕阳下的古老景观中，巍峨的山丘和部分埋藏的神秘遗迹，金色光芒在紫色天空下旋转，一个穿着传统服饰的孤独旅人在其中，散发出永恒的神秘感。",
  "，超现实的场景，巨大的晶体结构从地面中崛起，反射出梦幻的暮光光晕，奇异的发光生物与环境融为一体，营造出奇幻的画卷。",
  "，未来感十足的商队在繁星点点的夜空中行进，配备尖端科技的车辆和发光的帐篷，融合传统与先进技术，展现未来幻境。",
  "，极简主义风格的插画，柔和的渐变色背景与精致的线条描绘，清新淡雅的色调呈现出宁静而富有诗意的氛围，细节丰富而不喧闹。",
];

function generateCandidates(seed: string): string[] {
  return SUFFIXES.map((suffix) => seed + suffix);
}

const PromptOptimizerModal = ({ open, seed, onClose, onApply }: PromptOptimizerModalProps) => {
  const [topInput, setTopInput] = useState(seed);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Third modal (candidate edit)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalIdx, setEditModalIdx] = useState(0);

  // Reset on open
  useEffect(() => {
    if (open && seed) {
      setTopInput(seed);
      setCandidates(generateCandidates(seed));
      setSelectedIdx(0);
    }
  }, [open, seed]);

  const handleRefresh = useCallback(() => {
    const currentSeed = topInput.trim() || seed;
    setCandidates(generateCandidates(currentSeed));
    setSelectedIdx(0);
  }, [topInput, seed]);

  const handleApply = useCallback(() => {
    // Priority: if user edited top input and it's non-empty, use that; otherwise use selected candidate
    const topTrimmed = topInput.trim();
    const finalText = topTrimmed !== seed.trim() && topTrimmed.length > 0
      ? topTrimmed
      : candidates[selectedIdx] ?? topTrimmed;
    onApply(finalText);
  }, [topInput, seed, candidates, selectedIdx, onApply]);

  const handleOpenEditModal = (idx: number) => {
    setEditModalIdx(idx);
    setEditModalOpen(true);
  };

  const handleCandidateEdited = (newText: string) => {
    setCandidates(prev => prev.map((c, i) => i === editModalIdx ? newText : c));
    setSelectedIdx(editModalIdx);
    setEditModalOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="z-[250]" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[250] w-[90vw] max-w-lg max-h-[85vh] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onPointerDownOutside={() => onClose()}
        >
          <DialogTitle className="sr-only">提示生成器</DialogTitle>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
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

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 workspace-scroll">
            {/* Top input area */}
            <div className="relative rounded-xl bg-muted/40 border border-border">
              <textarea
                ref={textareaRef}
                value={topInput}
                onChange={(e) => setTopInput(e.target.value)}
                placeholder="输入你的提示，例如：可爱的猫"
                className="w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                style={{ minHeight: 120, maxHeight: 200 }}
                rows={4}
              />
              <div className="flex justify-end px-3 pb-3">
                <button
                  onClick={handleApply}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  优化
                </button>
              </div>
            </div>

            {/* Candidate list */}
            {candidates.map((text, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-colors cursor-pointer flex items-start gap-3",
                  selectedIdx === idx
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                )}
              >
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm text-foreground leading-relaxed">{text}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditCandidate(idx); }}
                  className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="编辑"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
          </div>

          {/* Bottom bar: number buttons + refresh */}
          <div className="shrink-0 border-t border-border px-5 py-3 flex items-center gap-2">
            {candidates.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={cn(
                  "flex-1 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-1",
                  selectedIdx === idx
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-muted-foreground/20 text-xs font-bold">
                  {idx + 1}
                </span>
              </button>
            ))}
            <button
              onClick={handleRefresh}
              className="flex h-9 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer border border-transparent"
              title="刷新"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default PromptOptimizerModal;

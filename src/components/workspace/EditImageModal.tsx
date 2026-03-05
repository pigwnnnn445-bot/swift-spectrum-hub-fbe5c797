import { useState, useEffect, useRef } from "react";
import { X, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditImageModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
}

const EditImageModal = ({ open, imageUrl, onClose }: EditImageModalProps) => {
  const [editPrompt, setEditPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setEditPrompt("");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = editPrompt.trim().length > 0;

  const handleGenerate = () => {
    if (!canSubmit) return;
    // TODO: 接入真实编辑图像接口
    console.log("[EditImageModal] Generate", { imageUrl, prompt: editPrompt.trim() });
    toast({ title: "编辑请求已提交（占位）" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗容器 */}
      <div className="relative z-10 w-[90vw] max-w-lg rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">在图像的基础上调整</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 主体输入区 */}
        <div className="px-5 py-4 flex-1">
          <textarea
            ref={textareaRef}
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="您可以尝试输入：将图像中人物的衣服颜色调整为红色，或将图像中的人物戴上圣诞帽"
            className="w-full min-h-[120px] max-h-[200px] resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
          />
        </div>

        {/* 底部操作区 */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          {/* 左：模型胶囊 */}
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground select-none">
            <span className="text-sm">🍌</span>
            Nano banana pro
            <span className="text-[10px]">♪</span>
          </span>

          {/* 右：Generate 按钮 */}
          <button
            disabled={!canSubmit}
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            发送
            <span className="flex items-center gap-0.5 text-xs opacity-80">
              <Zap className="h-3 w-3" />5
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditImageModal;

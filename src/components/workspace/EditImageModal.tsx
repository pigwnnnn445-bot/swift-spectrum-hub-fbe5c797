import { useState, useEffect, useRef, useCallback } from "react";
import { X, Zap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { ModelConfig } from "@/config/modelConfig";
import type { GenerateTask, GenerationMode } from "@/types/task";

/** 编辑生成的参数载荷 */
export interface EditGeneratePayload {
  editPrompt: string;
  modelId: number;
  modelName: string;
  modelImage: string;
  ratio: string;
  resolution: string;
  styleName?: string;
  styleId?: number | null;
  generationMode?: GenerationMode;
  similarity?: number;
  referenceImages?: string[];
  sourceImageUrl: string;
}

interface EditImageModalProps {
  open: boolean;
  imageUrl: string;
  task: GenerateTask | null;
  models: ModelConfig[];
  onClose: () => void;
  onGenerate: (payload: EditGeneratePayload) => void;
}

// ── 参数合成：原任务快照 + 新模型覆盖 + 不支持项回退 ──
function buildEditPayload(
  editPrompt: string,
  sourceImageUrl: string,
  snapshot: GenerateTask,
  newModel: ModelConfig
): EditGeneratePayload {
  // ratio: 如果新模型支持原比例则沿用，否则用新模型默认
  const ratio =
    newModel.ratio_flg === 1 && newModel.ratio.includes(snapshot.ratio)
      ? snapshot.ratio
      : newModel.ratio?.[0] || "1:1";

  // resolution: 沿用原值如果新模型包含，否则用新模型默认
  const snapshotRes = snapshot.resolution;
  const newModelResolutions = newModel.resolution.map((r) => r.resolution);
  const resolution =
    newModel.resolution_flg === 1 && newModelResolutions.includes(snapshotRes)
      ? snapshotRes
      : newModel.resolution?.[0]?.resolution || "";

  // style: 如果新模型支持风格且原 styleId 存在于新模型风格中，沿用；否则清空
  let styleName: string | undefined;
  let styleId: number | null = null;
  if (newModel.style_flg === 1 && snapshot.styleId != null) {
    const allStyles = newModel.style.flatMap((tab) => tab.resource);
    const found = allStyles.find((s) => s.id === snapshot.styleId);
    if (found) {
      styleId = found.id;
      styleName = found.resource_name;
    }
  }

  // similarity: 沿用（数值型，模型若不支持参考图则不传）
  const similarity =
    newModel.image_like_flg === 1 ? snapshot.similarity : undefined;

  // generationMode
  const generationMode = snapshot.generationMode;

  // referenceImages
  const referenceImages = snapshot.referenceImages;

  return {
    editPrompt,
    modelId: newModel.id,
    modelName: newModel.name,
    modelImage: newModel.image,
    ratio,
    resolution,
    styleName,
    styleId,
    generationMode,
    similarity,
    referenceImages,
    sourceImageUrl,
  };
}

const EditImageModal = ({
  open,
  imageUrl,
  task,
  models,
  onClose,
  onGenerate,
}: EditImageModalProps) => {
  const [editPrompt, setEditPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const MAX_HEIGHT = 280;

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + "px";
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, []);

  // Reset on open — set default model from task snapshot
  useEffect(() => {
    if (open && task) {
      setEditPrompt("");
      setDropdownOpen(false);
      const snapshotModel = models.find((m) => m.id === task.modelId);
      setSelectedModel(snapshotModel || models[0] || null);
      setTimeout(() => {
        textareaRef.current?.focus();
        resizeTextarea();
      }, 100);
    }
  }, [open, task, models, resizeTextarea]);

  useEffect(() => { resizeTextarea(); }, [editPrompt, resizeTextarea]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Click outside dropdown to close
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  if (!open || !task) return null;

  const canSubmit = editPrompt.trim().length > 0 && selectedModel !== null;

  const handleGenerate = () => {
    if (!canSubmit || !selectedModel) return;
    const payload = buildEditPayload(editPrompt.trim(), imageUrl, task, selectedModel);
    onGenerate(payload);
    toast({ title: "编辑请求已提交" });
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
          {/* 左：模型下拉选择器 */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer select-none"
            >
              {selectedModel && (
                <img
                  src={selectedModel.image}
                  alt={selectedModel.name}
                  className="h-4 w-4 rounded-sm object-cover"
                />
              )}
              <span className="max-w-[140px] truncate">
                {selectedModel?.name || "选择模型"}
              </span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 shrink-0 transition-transform",
                  dropdownOpen && "rotate-180"
                )}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 bottom-full mb-1.5 z-50 w-[260px] rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-[280px] overflow-y-auto workspace-scroll">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
                      model.id === selectedModel?.id && "bg-accent/30"
                    )}
                  >
                    <img
                      src={model.image}
                      alt={model.name}
                      className="h-7 w-7 shrink-0 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{model.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{model.content}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">⚡{model.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右：发送按钮 */}
          <button
            disabled={!canSubmit}
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            发送
            <span className="flex items-center gap-0.5 text-xs opacity-80">
              <Zap className="h-3 w-3" />
              {selectedModel?.price ?? 5}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditImageModal;

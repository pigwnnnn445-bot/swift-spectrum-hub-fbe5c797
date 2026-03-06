import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Coins, Sparkles, Proportions, ScanLine, Palette, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import ModelSelector from "./ModelSelector";
import StyleSelector from "./StyleSelector";
import UploadReferencePanel from "./UploadReferencePanel";
import {
  getOrderedEnabledImageLikes,
  getModelCapabilities,
  getDefaultRatio,
  getDefaultResolution,
  getDefaultStyleId,
  getStyleNameById,
  getStyleResources,
  DEFAULT_SIMILARITY,
} from "@/config/modelConfig";
import type { ModelConfig } from "@/config/modelConfig";
import type { GenerateTask } from "@/types/task";
import { cn } from "@/lib/utils";

export interface ComposerPayload {
  editPrompt: string;
  model: ModelConfig;
  ratio: string;
  resolution: string;
  styleId: number | null;
  styleName: string;
  similarity: number;
  referenceImages: string[];
}

export interface ImageEditComposerHandle {
  applyPrompt: (text: string) => void;
}

interface ImageEditComposerProps {
  task: GenerateTask;
  models: ModelConfig[];
  onGenerate: (payload: ComposerPayload) => void;
}

/* ── tiny popover wrapper ─────────────────────── */
function EntryPopover({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute left-0 bottom-full mb-2 z-50 min-w-[200px] max-w-[340px] rounded-xl border border-workspace-border bg-workspace-panel shadow-lg p-3 workspace-scroll max-h-[420px] overflow-y-auto"
    >
      {children}
    </div>
  );
}

/* ── icon entry button ────────────────────────── */
function EntryButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
        active
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border hover:bg-workspace-chip"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate max-w-[120px]">{label}</span>
    </button>
  );
}

const ImageEditComposer = forwardRef<ImageEditComposerHandle, ImageEditComposerProps>(
  ({ task, models, onGenerate }, ref) => {
    const [editPrompt, setEditPrompt] = useState("");
    const [mode, setMode] = useState<"edit" | "new">("edit");
    const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Parameter state
    const [ratio, setRatio] = useState("");
    const [resolution, setResolution] = useState("");
    const [styleId, setStyleId] = useState<number | null>(null);
    const [similarity, setSimilarity] = useState(50);
    const [referenceImages, setReferenceImages] = useState<string[]>([]);

    // Popover toggles
    const [ratioOpen, setRatioOpen] = useState(false);
    const [resolutionOpen, setResolutionOpen] = useState(false);
    const [styleOpen, setStyleOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      applyPrompt(text: string) {
        setEditPrompt(text);
        requestAnimationFrame(() => {
          const el = textareaRef.current;
          if (el) {
            el.focus();
            el.setSelectionRange(text.length, text.length);
          }
        });
      },
    }));

    // Initialize / reset on task change
    useEffect(() => {
      setEditPrompt("");
      setReferenceImages([]);
      const m = models.find((m) => m.id === task.modelId) ?? models[0] ?? null;
      setSelectedModel(m);
      if (m) initParamsFromModel(m, task);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task.id]);

    const initParamsFromModel = (model: ModelConfig, t: GenerateTask) => {
      const defRatio = getDefaultRatio(model);
      const ratioOptions = model.ratio_flg === 1 ? model.ratio : [];
      setRatio(ratioOptions.includes(t.ratio) ? t.ratio : defRatio);

      const defRes = getDefaultResolution(model);
      const resOptions = model.resolution_flg === 1 ? model.resolution.map((r) => r.resolution) : [];
      setResolution(resOptions.includes(t.resolution) ? t.resolution : defRes);

      if (model.style_flg === 1 && model.style.length > 0) {
        const allRes = model.style.flatMap((tab) => tab.resource);
        const found = allRes.find((r) => r.id === t.styleId);
        setStyleId(found ? t.styleId ?? null : getDefaultStyleId(model));
      } else {
        setStyleId(null);
      }

      setSimilarity(t.similarity ?? DEFAULT_SIMILARITY);
    };

    const handleModelChange = (model: ModelConfig) => {
      setSelectedModel(model);
      setReferenceImages([]);
      initParamsFromModel(model, task);
    };

    const handleSubmit = () => {
      if (!selectedModel || !editPrompt.trim()) return;

      // Required check
      const enabledLikes = getOrderedEnabledImageLikes(selectedModel);
      const isRequired = enabledLikes.some((item) => item.is_required === 1);
      if (isRequired && getTotalImageCount(referenceByType) < 1) {
        toast.error("请先上传参考图");
        return;
      }

      const styleName = getStyleNameById(selectedModel, styleId);
      onGenerate({
        editPrompt: editPrompt.trim(),
        model: selectedModel,
        ratio,
        resolution,
        styleId,
        styleName,
        similarity,
        referenceByType: getSubmittableReference(referenceByType),
      });
    };

    if (!selectedModel) return null;

    const caps = getModelCapabilities(selectedModel);
    const showModel = models.length > 1;

    const styleResources = getStyleResources(selectedModel);
    const currentStyleName = styleResources.find((r) => r.id === styleId)?.resource_name ?? "自动";
    const totalUploaded = getTotalImageCount(referenceByType);
    const uploadLabel = totalUploaded > 0 ? `已上传(${totalUploaded})` : "上传图片";
    const totalCost = selectedModel.price;

    return (
      <div className="border-t border-workspace-border bg-workspace-panel px-4 py-3 space-y-3">
        {/* Mode segmented tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-workspace-chip/30 p-0.5 w-fit">
          {([["edit", "编辑图像"], ["new", "新作品"]] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                mode === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-workspace-panel-foreground/70 hover:text-workspace-panel-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Textarea with inline mode badge on same line as text */}
        <div
          className="relative w-full rounded-lg border border-workspace-border bg-workspace-surface focus-within:ring-1 focus-within:ring-primary cursor-text"
          onClick={() => textareaRef.current?.focus()}
        >
          <div className="flex items-start gap-2 px-3 pt-2 pb-0">
            <span className="shrink-0 inline-flex items-center rounded-md bg-primary/15 text-primary px-2 py-0.5 text-xs font-medium select-none mt-0.5">
              {mode === "edit" ? "编辑图像" : "新作品"}
            </span>
            <textarea
              ref={textareaRef}
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder={mode === "edit" ? "在图像的基础上调整，您可以尝试输入：将图像中人物的衣服颜色调整为红色，或将图像中的人物带上圣诞帽" : "输入您的提示词，比如，可爱的猫"}
              className="flex-1 resize-none bg-transparent pb-2 pt-0 text-sm text-workspace-surface-foreground placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-[100px] prompt-textarea"
              rows={2}
            />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Model entry */}
          {showModel && (
            <ModelSelector models={models} selected={selectedModel} onSelect={handleModelChange} />
          )}

          {/* Ratio entry */}
          {caps.showRatio && (
            <div className="relative">
              <EntryButton
                icon={Proportions}
                label={ratio}
                active={ratioOpen}
                onClick={() => { setRatioOpen(!ratioOpen); setResolutionOpen(false); setStyleOpen(false); setUploadOpen(false); }}
              />
              <EntryPopover open={ratioOpen} onClose={() => setRatioOpen(false)}>
                <div className="flex flex-wrap gap-1.5 p-1">
                  {selectedModel.ratio.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setRatio(opt); setRatioOpen(false); }}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer",
                        ratio === opt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border hover:bg-workspace-chip"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </EntryPopover>
            </div>
          )}

          {/* Resolution entry */}
          {caps.showResolution && (
            <div className="relative">
              <EntryButton
                icon={ScanLine}
                label={resolution}
                active={resolutionOpen}
                onClick={() => { setResolutionOpen(!resolutionOpen); setRatioOpen(false); setStyleOpen(false); setUploadOpen(false); }}
              />
              <EntryPopover open={resolutionOpen} onClose={() => setResolutionOpen(false)}>
                <div className="flex flex-wrap gap-1.5 p-1">
                  {selectedModel.resolution.map((r) => (
                    <button
                      key={r.resolution}
                      onClick={() => { setResolution(r.resolution); setResolutionOpen(false); }}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer",
                        resolution === r.resolution
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border hover:bg-workspace-chip"
                      )}
                    >
                      {r.resolution}
                    </button>
                  ))}
                </div>
              </EntryPopover>
            </div>
          )}

          {/* Style entry */}
          {caps.showStyle && (
            <div className="relative">
              <EntryButton
                icon={Palette}
                label={currentStyleName}
                active={styleOpen}
                onClick={() => { setStyleOpen(!styleOpen); setRatioOpen(false); setResolutionOpen(false); setUploadOpen(false); }}
              />
              <EntryPopover open={styleOpen} onClose={() => setStyleOpen(false)}>
                <StyleSelector
                  resources={styleResources}
                  selectedId={styleId}
                  onSelect={(id) => { setStyleId(id); setStyleOpen(false); }}
                />
              </EntryPopover>
            </div>
          )}

          {/* Upload entry */}
          {caps.showUpload && (
            <div className="relative">
              <EntryButton
                icon={ImagePlus}
                label={uploadLabel}
                active={uploadOpen || totalUploaded > 0}
                onClick={() => { setUploadOpen(!uploadOpen); setRatioOpen(false); setResolutionOpen(false); setStyleOpen(false); }}
              />
              <EntryPopover open={uploadOpen} onClose={() => setUploadOpen(false)}>
                <div className="min-w-[280px]">
                  <DetailUploadReferencePanel
                    model={selectedModel}
                    value={referenceByType}
                    onChange={setReferenceByType}
                  />
                </div>
              </EntryPopover>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Generate button */}
          <button
            onClick={handleSubmit}
            disabled={!editPrompt.trim()}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-primary-foreground bg-gradient-to-r from-primary to-[hsl(var(--workspace-neon))] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Generate</span>
            <Coins className="h-3.5 w-3.5" />
            <span>{totalCost}</span>
          </button>
        </div>
      </div>
    );
  }
);

ImageEditComposer.displayName = "ImageEditComposer";

export default ImageEditComposer;

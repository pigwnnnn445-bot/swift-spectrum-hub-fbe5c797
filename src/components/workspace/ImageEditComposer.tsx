import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Coins, Sparkles, Proportions, ScanLine, Palette, ImagePlus, Minus, Plus, Zap, Hash, PaintBucket } from "lucide-react";
import ImageInpaintModal from "./ImageInpaintModal";
import type { InpaintPayload } from "./ImageInpaintModal";
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
  imageCount: number;
}

export interface ImageEditComposerHandle {
  applyPrompt: (text: string) => void;
  openInpaint: () => void;
}

interface ImageEditComposerProps {
  task: GenerateTask;
  /** Current detail image URL (for inpaint baseImage) */
  currentImageUrl?: string;
  models: ModelConfig[];
  onGenerate: (payload: ComposerPayload) => void;
  /** Called when inpaint modal sends; parent should create task & close detail */
  onInpaintGenerate?: (payload: InpaintPayload, task: GenerateTask) => void;
}

/* ── tiny popover wrapper ─────────────────────── */
function EntryPopover({
  open,
  onClose,
  children,
  className: extraClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
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

  // Clamp to viewport on open & resize
  useEffect(() => {
    if (!open || !ref.current) return;
    const clamp = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        el.style.left = "auto";
        el.style.right = "0";
      }
      if (rect.left < 0) {
        el.style.left = "0";
        el.style.right = "auto";
      }
    };
    requestAnimationFrame(clamp);
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [open]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 bottom-full mb-2 z-50 rounded-2xl border border-workspace-border bg-workspace-panel shadow-lg p-4 max-w-[calc(100vw-2rem)]",
        extraClassName
      )}
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
  ({ task, currentImageUrl, models, onGenerate, onInpaintGenerate }, ref) => {
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
    const [imageCount, setImageCount] = useState(1);

    // Popover toggles
    const [ratioOpen, setRatioOpen] = useState(false);
    const [resolutionOpen, setResolutionOpen] = useState(false);
    const [styleOpen, setStyleOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [countOpen, setCountOpen] = useState(false);
    const [inpaintOpen, setInpaintOpen] = useState(false);

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
      openInpaint() {
        setInpaintOpen(true);
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
      setImageCount(t.count >= 1 && t.count <= 4 ? t.count : 1);
    };

    const handleModelChange = (model: ModelConfig) => {
      setSelectedModel(model);
      setReferenceImages([]);
      setImageCount(1);
      initParamsFromModel(model, task);
    };

    const handleSubmit = () => {
      if (!selectedModel || !editPrompt.trim()) return;

      // Required check
      const enabledLikes = getOrderedEnabledImageLikes(selectedModel);
      const isRequired = enabledLikes.some((item) => item.is_required === 1);
      if (isRequired && referenceImages.length < 1) {
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
        referenceImages,
        imageCount,
      });
    };

    if (!selectedModel) return null;

    const caps = getModelCapabilities(selectedModel);
    const showModel = models.length > 1;

    const styleResources = getStyleResources(selectedModel);
    const currentStyleName = styleResources.find((r) => r.id === styleId)?.resource_name ?? "自动";
    const totalUploaded = referenceImages.length;
    const uploadLabel = totalUploaded > 0 ? `已上传(${totalUploaded})` : "上传参考图";
    const totalCost = selectedModel.price;

    return (
      <div className="border-t border-workspace-border bg-workspace-panel px-4 py-3 space-y-3">
        {/* Mode segmented tabs + inpaint button */}
        <div className="flex items-center gap-2">
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
              className="flex-1 resize-none bg-transparent pb-2 pt-0 text-sm text-workspace-surface-foreground placeholder:text-muted-foreground focus:outline-none min-h-[100px] max-sm:min-h-[140px] max-h-[220px] prompt-textarea"
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
                onClick={() => { setRatioOpen(!ratioOpen); setResolutionOpen(false); setCountOpen(false); setStyleOpen(false); setUploadOpen(false); }}
              />
              <EntryPopover open={ratioOpen} onClose={() => setRatioOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
                <p className="text-sm text-muted-foreground mb-3">比例</p>
                <div className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain workspace-scroll" style={{ maxHeight: "min(340px, calc(100dvh - 120px))" }}>
                  {selectedModel.ratio.map((opt) => {
                    const isSelected = ratio === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => { setRatio(opt); setRatioOpen(false); }}
                        className={cn(
                          "flex items-center px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left text-sm font-medium",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-workspace-chip/60 text-workspace-panel-foreground"
                        )}
                      >
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
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
                onClick={() => { setResolutionOpen(!resolutionOpen); setRatioOpen(false); setCountOpen(false); setStyleOpen(false); setUploadOpen(false); }}
              />
              <EntryPopover open={resolutionOpen} onClose={() => setResolutionOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
                <p className="text-sm text-muted-foreground mb-3">分辨率</p>
                <div className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain workspace-scroll" style={{ maxHeight: "min(340px, calc(100dvh - 120px))" }}>
                  {selectedModel.resolution.map((r) => {
                    const isSelected = resolution === r.resolution;
                    return (
                      <button
                        key={r.resolution}
                        onClick={() => { setResolution(r.resolution); setResolutionOpen(false); }}
                        className={cn(
                          "flex items-center px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left text-sm font-medium",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-workspace-chip/60 text-workspace-panel-foreground"
                        )}
                      >
                        <span className="truncate">{r.resolution}</span>
                      </button>
                    );
                  })}
                </div>
              </EntryPopover>
            </div>
          )}

          {/* Image Count entry */}
          {caps.showImageCount && (
            <div className="relative">
              <EntryButton
                icon={Hash}
                label={`${imageCount}张`}
                active={countOpen}
                onClick={() => { setCountOpen(!countOpen); setRatioOpen(false); setResolutionOpen(false); setStyleOpen(false); setUploadOpen(false); }}
              />
              <EntryPopover open={countOpen} onClose={() => setCountOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
                <p className="text-sm text-muted-foreground mb-3">生图数量</p>
                <div className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain workspace-scroll" style={{ maxHeight: "min(340px, calc(100dvh - 120px))" }}>
                  {[1, 2, 3, 4].map((n) => {
                    const isSelected = imageCount === n;
                    return (
                      <button
                        key={n}
                        onClick={() => { setImageCount(n); setCountOpen(false); }}
                        className={cn(
                          "flex items-center px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left text-sm font-medium",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-workspace-chip/60 text-workspace-panel-foreground"
                        )}
                      >
                        {n} 张
                      </button>
                    );
                  })}
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
                onClick={() => { setStyleOpen(!styleOpen); setRatioOpen(false); setResolutionOpen(false); setCountOpen(false); setUploadOpen(false); }}
              />
              <EntryPopover open={styleOpen} onClose={() => setStyleOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
                <p className="text-sm text-muted-foreground mb-3">风格</p>
                <div className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain workspace-scroll" style={{ maxHeight: "min(340px, calc(100dvh - 120px))" }}>
                  {styleResources.map((res) => {
                    const isSelected = styleId === res.id;
                    return (
                      <button
                        key={res.id}
                        ref={(el) => {
                          if (isSelected && el && styleOpen) {
                            requestAnimationFrame(() => {
                              el.scrollIntoView({ block: "center", behavior: "instant" });
                            });
                          }
                        }}
                        onClick={() => { setStyleId(res.id); setStyleOpen(false); }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-workspace-chip/60 text-workspace-panel-foreground"
                        )}
                      >
                        <img
                          src={res.image}
                          alt={res.resource_name}
                          className="h-10 w-10 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-sm font-medium truncate">{res.resource_name}</span>
                      </button>
                    );
                  })}
                </div>
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
                onClick={() => { setUploadOpen(!uploadOpen); setRatioOpen(false); setResolutionOpen(false); setCountOpen(false); setStyleOpen(false); }}
              />
              <EntryPopover open={uploadOpen} onClose={() => setUploadOpen(false)}>
                <div className="min-w-[280px] space-y-4 overflow-y-auto overscroll-contain" style={{ maxHeight: "min(340px, calc(100dvh - 120px))" }}>
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50">
                      上传参考图
                    </h3>
                    <UploadReferencePanel
                      key={selectedModel.id}
                      model={selectedModel}
                      images={referenceImages}
                      onImagesChange={setReferenceImages}
                    />
                  </div>

                  {/* 相似度 */}
                  {caps.showSimilarity && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50 text-center">
                        相似度
                      </h3>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => setSimilarity((prev) => Math.max(0, prev - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors"
                        >
                          <Minus className="h-4 w-4 text-workspace-panel-foreground" />
                        </button>
                        <span className="min-w-[2.5rem] text-center text-sm font-medium text-workspace-panel-foreground">
                          {similarity}
                        </span>
                        <button
                          onClick={() => setSimilarity((prev) => Math.min(100, prev + 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors"
                        >
                          <Plus className="h-4 w-4 text-workspace-panel-foreground" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </EntryPopover>
            </div>
          )}


          {/* Spacer */}
          <div className="flex-1" />

          {/* Send button – aligned with HeroPromptBar */}
          <button
            onClick={handleSubmit}
            disabled={!editPrompt.trim()}
            className="inline-flex items-center justify-center whitespace-nowrap transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-gradient-to-r from-primary to-workspace-neon h-8 w-8 sm:w-auto sm:px-3 text-sm font-bold rounded-full text-white gap-1"
          >
            <span className="hidden sm:inline">发送</span>
            <span>⚡</span>
            <span className="hidden sm:inline text-white/70">{totalCost}</span>
          </button>
        </div>

        {/* Inpaint modal – z-[200] to sit above the detail overlay (z-[100]) */}
        {currentImageUrl && onInpaintGenerate && (
          <ImageInpaintModal
            open={inpaintOpen}
            imageUrl={currentImageUrl}
            overlayClassName="z-[200]"
            onClose={() => { setInpaintOpen(false); setMode("edit"); }}
            onGenerate={(payload: InpaintPayload) => {
              if (!payload.maskDataUrl) {
                toast.error("请先涂抹需要修改的区域");
                return;
              }
              setInpaintOpen(false);
              setMode("edit");
              onInpaintGenerate(payload, task);
            }}
          />
        )}
      </div>
    );
  }
);

ImageEditComposer.displayName = "ImageEditComposer";

export default ImageEditComposer;

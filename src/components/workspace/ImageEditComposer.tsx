import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Coins, Sparkles, Proportions, ScanLine, Palette, ImagePlus, Minus, Plus, Hash, PaintBucket, ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import ImageInpaintModal from "./ImageInpaintModal";
import type { InpaintPayload } from "./ImageInpaintModal";
import { toast } from "sonner";
import ModelSelector from "./ModelSelector";
import StyleSelector from "./StyleSelector";
import UploadReferencePanel from "./UploadReferencePanel";
import PromptGeneratorModal from "./PromptGeneratorModal";
import PromptOptimizerModal from "./PromptOptimizerModal";
import MobileDrawerPicker from "./MobileDrawerPicker";
import { useIsMobile } from "@/hooks/use-mobile";
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

/* ── tiny popover wrapper (desktop only) ─────────────────────── */
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
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-all cursor-pointer min-h-[36px]",
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

/* ── Drawer item row (reusable) ── */
function DrawerItem({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center px-4 py-3 rounded-xl transition-colors cursor-pointer text-left text-sm font-medium",
        selected ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

const ImageEditComposer = forwardRef<ImageEditComposerHandle, ImageEditComposerProps>(
  ({ task, currentImageUrl, models, onGenerate, onInpaintGenerate }, ref) => {
    const isMobile = useIsMobile();
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

    // Panel toggles
    const [modelOpen, setModelOpen] = useState(false);
    const [ratioOpen, setRatioOpen] = useState(false);
    const [resolutionOpen, setResolutionOpen] = useState(false);
    const [styleOpen, setStyleOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [countOpen, setCountOpen] = useState(false);
    const [inpaintOpen, setInpaintOpen] = useState(false);

    // Prompt generator
    const [genOpen, setGenOpen] = useState(false);
    const [optOpen, setOptOpen] = useState(false);
    const [seed, setSeed] = useState("");

    const closeAllPanels = () => {
      setRatioOpen(false); setResolutionOpen(false); setStyleOpen(false);
      setUploadOpen(false); setCountOpen(false); setModelOpen(false);
    };

    useImperativeHandle(ref, () => ({
      applyPrompt(text: string) {
        setEditPrompt(text);
        requestAnimationFrame(() => {
          const el = textareaRef.current;
          if (el) { el.focus(); el.setSelectionRange(text.length, text.length); }
        });
      },
      openInpaint() { setInpaintOpen(true); },
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
      setModelOpen(false);
    };

    const handleSubmit = () => {
      if (!selectedModel || !editPrompt.trim()) return;
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
        ratio, resolution, styleId, styleName, similarity, referenceImages, imageCount,
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

    /* ── Desktop popover list content ── */
    const ratioListContent = (close: () => void) => (
      <div className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain workspace-scroll" style={{ maxHeight: "min(340px, calc(100dvh - 120px))" }}>
        {selectedModel.ratio.map((opt) => (
          <button key={opt} onClick={() => { setRatio(opt); close(); }}
            className={cn("flex items-center px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left text-sm font-medium",
              ratio === opt ? "bg-primary text-primary-foreground" : "hover:bg-workspace-chip/60 text-workspace-panel-foreground"
            )}>
            <span className="truncate">{opt}</span>
          </button>
        ))}
      </div>
    );

    const resolutionListContent = (close: () => void) => (
      <div className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain workspace-scroll" style={{ maxHeight: "min(340px, calc(100dvh - 120px))" }}>
        {selectedModel.resolution.map((r) => (
          <button key={r.resolution} onClick={() => { setResolution(r.resolution); close(); }}
            className={cn("flex items-center px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left text-sm font-medium",
              resolution === r.resolution ? "bg-primary text-primary-foreground" : "hover:bg-workspace-chip/60 text-workspace-panel-foreground"
            )}>
            <span className="truncate">{r.resolution}</span>
          </button>
        ))}
      </div>
    );

    const countListContent = (close: () => void) => (
      <div className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain workspace-scroll" style={{ maxHeight: "min(340px, calc(100dvh - 120px))" }}>
        {[1, 2, 3, 4].map((n) => (
          <button key={n} onClick={() => { setImageCount(n); close(); }}
            className={cn("flex items-center px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left text-sm font-medium",
              imageCount === n ? "bg-primary text-primary-foreground" : "hover:bg-workspace-chip/60 text-workspace-panel-foreground"
            )}>
            {n} 张
          </button>
        ))}
      </div>
    );

    const styleListContent = (close: () => void) => (
      <div className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain workspace-scroll" style={{ maxHeight: "min(340px, calc(100dvh - 120px))" }}>
        {styleResources.map((res) => (
          <button key={res.id} onClick={() => { setStyleId(res.id); close(); }}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left",
              styleId === res.id ? "bg-primary text-primary-foreground" : "hover:bg-workspace-chip/60 text-workspace-panel-foreground"
            )}>
            <img src={res.image} alt={res.resource_name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
            <span className="text-sm font-medium truncate">{res.resource_name}</span>
          </button>
        ))}
      </div>
    );

    return (
      <div className="border-t border-workspace-border bg-workspace-panel px-4 py-3 space-y-3">
        {/* Mode segmented tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-workspace-chip/30 p-0.5 w-fit">
            {([["edit", "编辑图像"], ["new", "新作品"]] as const).map(([value, label]) => (
              <button key={value} onClick={() => setMode(value)}
                className={cn("rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                  mode === value ? "bg-primary text-primary-foreground shadow-sm" : "text-workspace-panel-foreground/70 hover:text-workspace-panel-foreground"
                )}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative w-full rounded-lg border border-workspace-border bg-workspace-surface focus-within:ring-1 focus-within:ring-primary cursor-text"
          onClick={() => textareaRef.current?.focus()}>
          <div className="flex items-start gap-2 px-3 pt-2 pb-0 min-w-0">
            <span className="shrink-0 inline-flex items-center rounded-md bg-primary/15 text-primary px-2 py-0.5 text-xs font-medium select-none mt-0.5">
              {mode === "edit" ? "编辑图像" : "新作品"}
            </span>
            <textarea ref={textareaRef} value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)}
              placeholder={mode === "edit" ? "在图像的基础上调整，您可以尝试输入：将图像中人物的衣服颜色调整为红色，或将图像中的人物带上圣诞帽" : "输入您的提示词，比如，可爱的猫"}
              className="flex-1 min-w-0 resize-none bg-transparent pb-2 pt-0 text-sm text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/50 focus:outline-none min-h-[100px] max-sm:min-h-[140px] overflow-y-auto prompt-textarea max-h-[min(260px,calc(100dvh-260px))] md:max-h-[220px]"
              style={{ wordBreak: "break-word", overflowWrap: "break-word" }} rows={2} />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Model entry */}
          {showModel && (
            isMobile ? (
              <button onClick={() => { closeAllPanels(); setModelOpen(true); }}
                className="flex items-center gap-2 rounded-lg border border-workspace-border bg-workspace-chip/50 px-2.5 py-2 cursor-pointer hover:bg-workspace-chip transition-colors text-left min-h-[36px]">
                <img src={selectedModel.image} alt={selectedModel.name} className="h-5 w-5 rounded object-cover shrink-0" />
                <span className="text-xs font-medium text-workspace-surface-foreground truncate max-w-[100px]">{selectedModel.name}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
              </button>
            ) : (
              <ModelSelector models={models} selected={selectedModel} onSelect={handleModelChange} />
            )
          )}

          {/* Ratio */}
          {caps.showRatio && (
            isMobile ? (
              <EntryButton icon={Proportions} label={ratio} active={ratioOpen}
                onClick={() => { closeAllPanels(); setRatioOpen(true); }} />
            ) : (
              <div className="relative">
                <EntryButton icon={Proportions} label={ratio} active={ratioOpen}
                  onClick={() => { closeAllPanels(); setRatioOpen(!ratioOpen); }} />
                <EntryPopover open={ratioOpen} onClose={() => setRatioOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
                  <p className="text-sm text-muted-foreground mb-3">比例</p>
                  {ratioListContent(() => setRatioOpen(false))}
                </EntryPopover>
              </div>
            )
          )}

          {/* Resolution */}
          {caps.showResolution && (
            isMobile ? (
              <EntryButton icon={ScanLine} label={resolution} active={resolutionOpen}
                onClick={() => { closeAllPanels(); setResolutionOpen(true); }} />
            ) : (
              <div className="relative">
                <EntryButton icon={ScanLine} label={resolution} active={resolutionOpen}
                  onClick={() => { closeAllPanels(); setResolutionOpen(!resolutionOpen); }} />
                <EntryPopover open={resolutionOpen} onClose={() => setResolutionOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
                  <p className="text-sm text-muted-foreground mb-3">分辨率</p>
                  {resolutionListContent(() => setResolutionOpen(false))}
                </EntryPopover>
              </div>
            )
          )}

          {/* Image Count */}
          {caps.showImageCount && (
            isMobile ? (
              <EntryButton icon={Hash} label={`${imageCount}张`} active={countOpen}
                onClick={() => { closeAllPanels(); setCountOpen(true); }} />
            ) : (
              <div className="relative">
                <EntryButton icon={Hash} label={`${imageCount}张`} active={countOpen}
                  onClick={() => { closeAllPanels(); setCountOpen(!countOpen); }} />
                <EntryPopover open={countOpen} onClose={() => setCountOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
                  <p className="text-sm text-muted-foreground mb-3">生图数量</p>
                  {countListContent(() => setCountOpen(false))}
                </EntryPopover>
              </div>
            )
          )}

          {/* Style */}
          {caps.showStyle && (
            isMobile ? (
              <EntryButton icon={Palette} label={currentStyleName} active={styleOpen}
                onClick={() => { closeAllPanels(); setStyleOpen(true); }} />
            ) : (
              <div className="relative">
                <EntryButton icon={Palette} label={currentStyleName} active={styleOpen}
                  onClick={() => { closeAllPanels(); setStyleOpen(!styleOpen); }} />
                <EntryPopover open={styleOpen} onClose={() => setStyleOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
                  <p className="text-sm text-muted-foreground mb-3">风格</p>
                  {styleListContent(() => setStyleOpen(false))}
                </EntryPopover>
              </div>
            )
          )}

          {/* Upload */}
          {caps.showUpload && (
            isMobile ? (
              <EntryButton icon={ImagePlus} label={uploadLabel} active={uploadOpen || totalUploaded > 0}
                onClick={() => { closeAllPanels(); setUploadOpen(true); }} />
            ) : (
              <Popover open={uploadOpen} onOpenChange={setUploadOpen}>
                <PopoverTrigger asChild>
                  <button onClick={() => closeAllPanels()}
                    className={cn("flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                      uploadOpen || totalUploaded > 0
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border hover:bg-workspace-chip"
                    )}>
                    <ImagePlus className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[120px]">{uploadLabel}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" sideOffset={8} avoidCollisions collisionPadding={12}
                  className="z-[150] rounded-2xl border border-workspace-border bg-workspace-panel shadow-lg p-4 !w-[min(90vw,340px)] max-w-[calc(100vw-24px)]">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50 mb-3">上传参考图</h3>
                  <div className="overflow-y-auto overscroll-contain workspace-scroll"
                    style={{ maxHeight: "min(340px, calc(100dvh - 180px))", touchAction: "pan-y", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
                    <div className="space-y-4">
                      <UploadReferencePanel key={selectedModel.id} model={selectedModel}
                        imagesByType={{ 0: referenceImages }}
                        onImagesByTypeChange={(byType) => setReferenceImages(Object.values(byType).flat())} />
                      {caps.showSimilarity && (
                        <div className="space-y-2.5">
                          <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50 text-center">相似度</h3>
                          <div className="flex items-center justify-center gap-4">
                            <button onClick={() => setSimilarity((prev) => Math.max(0, prev - 1))}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors">
                              <Minus className="h-4 w-4 text-workspace-panel-foreground" />
                            </button>
                            <span className="min-w-[2.5rem] text-center text-sm font-medium text-workspace-panel-foreground">{similarity}</span>
                            <button onClick={() => setSimilarity((prev) => Math.min(100, prev + 1))}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors">
                              <Plus className="h-4 w-4 text-workspace-panel-foreground" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Prompt generator button */}
          <button onClick={() => setGenOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 h-8 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">提示词生成器</span>
          </button>
          <button onClick={handleSubmit} disabled={!editPrompt.trim()}
            className="inline-flex items-center justify-center whitespace-nowrap transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-gradient-to-r from-primary to-workspace-neon h-8 w-8 sm:w-auto sm:px-3 text-sm font-bold rounded-full text-white gap-1">
            <span className="hidden sm:inline">发送</span>
            <span>⚡</span>
            <span className="hidden sm:inline text-white/70">{totalCost}</span>
          </button>
        </div>

        {/* ── Mobile/Tablet Drawers ── */}
        {isMobile && (
          <>
            {/* Model Drawer */}
            {showModel && (
              <MobileDrawerPicker open={modelOpen} onClose={() => setModelOpen(false)} title="切换模型">
                <div className="flex flex-col gap-1">
                  {models.map((model) => (
                    <button key={model.id} onClick={() => handleModelChange(model)}
                      className={cn("flex w-full items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer",
                        model.id === selectedModel.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}>
                      <img src={model.image} alt={model.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{model.name}</div>
                        <div className={cn("text-xs line-clamp-1", model.id === selectedModel.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{model.content}</div>
                      </div>
                      <span className={cn("text-xs shrink-0", model.id === selectedModel.id ? "text-primary-foreground/70" : "text-muted-foreground")}>⚡{model.price}</span>
                    </button>
                  ))}
                </div>
              </MobileDrawerPicker>
            )}

            {/* Ratio Drawer */}
            {caps.showRatio && (
              <MobileDrawerPicker open={ratioOpen} onClose={() => setRatioOpen(false)} title="比例">
                <div className="flex flex-col gap-1">
                  {selectedModel.ratio.map((opt) => (
                    <DrawerItem key={opt} selected={ratio === opt} onClick={() => { setRatio(opt); setRatioOpen(false); }}>
                      {opt}
                    </DrawerItem>
                  ))}
                </div>
              </MobileDrawerPicker>
            )}

            {/* Resolution Drawer */}
            {caps.showResolution && (
              <MobileDrawerPicker open={resolutionOpen} onClose={() => setResolutionOpen(false)} title="分辨率">
                <div className="flex flex-col gap-1">
                  {selectedModel.resolution.map((r) => (
                    <DrawerItem key={r.resolution} selected={resolution === r.resolution} onClick={() => { setResolution(r.resolution); setResolutionOpen(false); }}>
                      {r.resolution}
                    </DrawerItem>
                  ))}
                </div>
              </MobileDrawerPicker>
            )}

            {/* Count Drawer */}
            {caps.showImageCount && (
              <MobileDrawerPicker open={countOpen} onClose={() => setCountOpen(false)} title="生图数量">
                <div className="flex flex-col gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <DrawerItem key={n} selected={imageCount === n} onClick={() => { setImageCount(n); setCountOpen(false); }}>
                      {n} 张
                    </DrawerItem>
                  ))}
                </div>
              </MobileDrawerPicker>
            )}

            {/* Style Drawer */}
            {caps.showStyle && (
              <MobileDrawerPicker open={styleOpen} onClose={() => setStyleOpen(false)} title="风格">
                <div className="flex flex-col gap-1">
                  {styleResources.map((res) => (
                    <button key={res.id} onClick={() => { setStyleId(res.id); setStyleOpen(false); }}
                      className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-left",
                        styleId === res.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}>
                      <img src={res.image} alt={res.resource_name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                      <span className="text-sm font-medium truncate">{res.resource_name}</span>
                    </button>
                  ))}
                </div>
              </MobileDrawerPicker>
            )}

            {/* Upload Drawer */}
            {caps.showUpload && (
              <MobileDrawerPicker open={uploadOpen} onClose={() => setUploadOpen(false)} title="上传参考图">
                <div className="space-y-4">
                  <UploadReferencePanel key={selectedModel.id} model={selectedModel}
                    imagesByType={{ 0: referenceImages }}
                    onImagesByTypeChange={(byType) => setReferenceImages(Object.values(byType).flat())} />
                  {caps.showSimilarity && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center">相似度</h3>
                      <div className="flex items-center justify-center gap-4">
                        <button onClick={() => setSimilarity((prev) => Math.max(0, prev - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 cursor-pointer transition-colors">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[2.5rem] text-center text-sm font-medium">{similarity}</span>
                        <button onClick={() => setSimilarity((prev) => Math.min(100, prev + 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 cursor-pointer transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </MobileDrawerPicker>
            )}
          </>
        )}

        {/* Inpaint modal */}
        {currentImageUrl && onInpaintGenerate && (
          <ImageInpaintModal open={inpaintOpen} imageUrl={currentImageUrl} overlayClassName="z-[200]"
            onClose={() => { setInpaintOpen(false); setMode("edit"); }}
            onGenerate={(payload: InpaintPayload) => {
              if (!payload.maskDataUrl) { toast.error("请先涂抹需要修改的区域"); return; }
              setInpaintOpen(false); setMode("edit");
              onInpaintGenerate(payload, task);
            }} />
        )}

        {/* Prompt generator modals */}
        <PromptGeneratorModal open={genOpen} onClose={() => setGenOpen(false)}
          onOptimize={(s) => { setSeed(s); setGenOpen(false); setOptOpen(true); }} />
        <PromptOptimizerModal open={optOpen} seed={seed} onClose={() => setOptOpen(false)}
          onApply={(text) => {
            setEditPrompt(text); setOptOpen(false);
            requestAnimationFrame(() => {
              const el = textareaRef.current;
              if (el) { el.focus(); el.setSelectionRange(text.length, text.length); }
            });
          }} />
      </div>
    );
  }
);

ImageEditComposer.displayName = "ImageEditComposer";

export default ImageEditComposer;

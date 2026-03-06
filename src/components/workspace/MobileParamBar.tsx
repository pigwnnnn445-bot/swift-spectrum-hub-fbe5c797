/**
 * 移动端首页参数选择栏
 * 仅在小屏（< sm）显示，对齐详情页 ImageEditComposer 的入口样式与面板结构
 */
import { useState, useEffect, useRef } from "react";
import { Proportions, ScanLine, Palette, ImagePlus, Hash, Minus, Plus } from "lucide-react";
import ModelSelector from "./ModelSelector";
import StyleSelector from "./StyleSelector";
import UploadReferencePanel from "./UploadReferencePanel";
import {
  getModelCapabilities,
  getDefaultRatio,
  getDefaultResolution,
  getDefaultStyleId,
  getStyleNameById,
  getStyleResources,
  DEFAULT_SIMILARITY,
} from "@/config/modelConfig";
import type { ModelConfig } from "@/config/modelConfig";
import { cn } from "@/lib/utils";

/* ── tiny popover wrapper (same as ImageEditComposer) ── */
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
        extraClassName,
      )}
    >
      {children}
    </div>
  );
}

/* ── icon entry button (same as ImageEditComposer) ── */
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
          : "bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border hover:bg-workspace-chip",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate max-w-[120px]">{label}</span>
    </button>
  );
}

/* ── props ── */
interface MobileParamBarProps {
  selectedModel: ModelConfig;
  models: ModelConfig[];
  onModelChange: (model: ModelConfig) => void;
  imageCount: number;
  onImageCountChange: (count: number) => void;
  onRatioChange?: (ratio: string) => void;
  onResolutionChange?: (resolution: string) => void;
  onStyleChange?: (styleId: number | null, styleName: string) => void;
  onSimilarityChange?: (similarity: number) => void;
  referenceImages?: string[];
  onReferenceImagesChange?: (images: string[]) => void;
}

const MobileParamBar = ({
  selectedModel,
  models,
  onModelChange,
  imageCount,
  onImageCountChange,
  onRatioChange,
  onResolutionChange,
  onStyleChange,
  onSimilarityChange,
  referenceImages,
  onReferenceImagesChange,
}: MobileParamBarProps) => {
  // Local state (mirrors sidebar pattern)
  const [ratio, setRatioLocal] = useState(getDefaultRatio(selectedModel));
  const [resolution, setResolutionLocal] = useState(getDefaultResolution(selectedModel));
  const [styleId, setStyleIdLocal] = useState<number | null>(getDefaultStyleId(selectedModel));
  const [similarity, setSimilarityLocal] = useState(DEFAULT_SIMILARITY);

  // Popover toggles
  const [ratioOpen, setRatioOpen] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [countOpen, setCountOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Sync helpers
  const setRatio = (v: string) => {
    setRatioLocal(v);
    onRatioChange?.(v);
  };
  const setResolution = (v: string) => {
    setResolutionLocal(v);
    onResolutionChange?.(v);
  };
  const setStyleId = (id: number | null) => {
    setStyleIdLocal(id);
    onStyleChange?.(id, getStyleNameById(selectedModel, id));
  };
  const setSimilarity = (v: number) => {
    setSimilarityLocal(v);
    onSimilarityChange?.(v);
  };

  const closeAll = () => {
    setRatioOpen(false);
    setResolutionOpen(false);
    setStyleOpen(false);
    setCountOpen(false);
    setUploadOpen(false);
  };

  // Init on mount
  useEffect(() => {
    onRatioChange?.(getDefaultRatio(selectedModel));
    onResolutionChange?.(getDefaultResolution(selectedModel));
    const initStyleId = getDefaultStyleId(selectedModel);
    onStyleChange?.(initStyleId, getStyleNameById(selectedModel, initStyleId));
    onSimilarityChange?.(DEFAULT_SIMILARITY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset on model change (external)
  useEffect(() => {
    const newRatio = getDefaultRatio(selectedModel);
    const newRes = getDefaultResolution(selectedModel);
    const newStyleId = getDefaultStyleId(selectedModel);
    setRatioLocal(newRatio);
    setResolutionLocal(newRes);
    setStyleIdLocal(newStyleId);
    setSimilarityLocal(DEFAULT_SIMILARITY);
    onRatioChange?.(newRatio);
    onResolutionChange?.(newRes);
    onStyleChange?.(newStyleId, getStyleNameById(selectedModel, newStyleId));
    onSimilarityChange?.(DEFAULT_SIMILARITY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel.id]);

  const handleModelChange = (model: ModelConfig) => {
    onModelChange(model);
  };

  const caps = getModelCapabilities(selectedModel);
  const showModel = models.length > 1;
  const styleResources = getStyleResources(selectedModel);
  const currentStyleName = styleResources.find((r) => r.id === styleId)?.resource_name ?? "自动";
  const totalUploaded = referenceImages?.length ?? 0;
  const uploadLabel = totalUploaded > 0 ? `已上传(${totalUploaded})` : "上传参考图";

  return (
    <div className="sm:hidden px-4 pb-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Model */}
        {showModel && (
          <ModelSelector models={models} selected={selectedModel} onSelect={handleModelChange} />
        )}

        {/* Ratio */}
        {caps.showRatio && (
          <div className="relative">
            <EntryButton
              icon={Proportions}
              label={ratio}
              active={ratioOpen}
              onClick={() => { closeAll(); setRatioOpen(!ratioOpen); }}
            />
            <EntryPopover open={ratioOpen} onClose={() => setRatioOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
              <p className="text-sm text-muted-foreground mb-3">比例</p>
              <div className="flex flex-col gap-0.5 max-h-[340px] overflow-y-auto workspace-scroll">
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
                          : "hover:bg-workspace-chip/60 text-workspace-panel-foreground",
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

        {/* Resolution */}
        {caps.showResolution && (
          <div className="relative">
            <EntryButton
              icon={ScanLine}
              label={resolution}
              active={resolutionOpen}
              onClick={() => { closeAll(); setResolutionOpen(!resolutionOpen); }}
            />
            <EntryPopover open={resolutionOpen} onClose={() => setResolutionOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
              <p className="text-sm text-muted-foreground mb-3">分辨率</p>
              <div className="flex flex-col gap-0.5 max-h-[340px] overflow-y-auto workspace-scroll">
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
                          : "hover:bg-workspace-chip/60 text-workspace-panel-foreground",
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

        {/* Image Count */}
        {caps.showImageCount && (
          <div className="relative">
            <EntryButton
              icon={Hash}
              label={`${imageCount}张`}
              active={countOpen}
              onClick={() => { closeAll(); setCountOpen(!countOpen); }}
            />
            <EntryPopover open={countOpen} onClose={() => setCountOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
              <p className="text-sm text-muted-foreground mb-3">生图数量</p>
              <div className="flex flex-col gap-0.5 max-h-[340px] overflow-y-auto workspace-scroll">
                {[1, 2, 3, 4].map((n) => {
                  const isSelected = imageCount === n;
                  return (
                    <button
                      key={n}
                      onClick={() => { onImageCountChange(n); setCountOpen(false); }}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left text-sm font-medium",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-workspace-chip/60 text-workspace-panel-foreground",
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

        {/* Style */}
        {caps.showStyle && (
          <div className="relative">
            <EntryButton
              icon={Palette}
              label={currentStyleName}
              active={styleOpen}
              onClick={() => { closeAll(); setStyleOpen(!styleOpen); }}
            />
            <EntryPopover open={styleOpen} onClose={() => setStyleOpen(false)} className="w-fit min-w-[200px] max-w-[calc(100vw-24px)]">
              <p className="text-sm text-muted-foreground mb-3">风格</p>
              <div className="flex flex-col gap-0.5 max-h-[340px] overflow-y-auto workspace-scroll">
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
                          : "hover:bg-workspace-chip/60 text-workspace-panel-foreground",
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

        {/* Upload Reference */}
        {caps.showUpload && (
          <div className="relative">
            <EntryButton
              icon={ImagePlus}
              label={uploadLabel}
              active={uploadOpen || totalUploaded > 0}
              onClick={() => { closeAll(); setUploadOpen(!uploadOpen); }}
            />
            <EntryPopover open={uploadOpen} onClose={() => setUploadOpen(false)}>
              <div className="min-w-[280px] space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50">
                    上传参考图
                  </h3>
                  <UploadReferencePanel
                    key={selectedModel.id}
                    model={selectedModel}
                    images={referenceImages}
                    onImagesChange={onReferenceImagesChange}
                  />
                </div>

                {/* Similarity */}
                {caps.showSimilarity && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50 text-center">
                      相似度
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => setSimilarity(Math.max(0, similarity - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors"
                      >
                        <Minus className="h-4 w-4 text-workspace-panel-foreground" />
                      </button>
                      <span className="min-w-[2.5rem] text-center text-sm font-medium text-workspace-panel-foreground">
                        {similarity}
                      </span>
                      <button
                        onClick={() => setSimilarity(Math.min(100, similarity + 1))}
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
      </div>
    </div>
  );
};

export default MobileParamBar;

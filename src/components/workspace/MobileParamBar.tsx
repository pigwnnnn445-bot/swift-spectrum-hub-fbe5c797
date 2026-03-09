/**
 * 移动端首页参数选择栏
 * 使用底部抽屉（Drawer）替代桌面端 Popover，适配移动端和平板端触控体验
 */
import { useState, useEffect } from "react";
import { Proportions, ScanLine, Palette, ImagePlus, Hash, ChevronDown } from "lucide-react";
import UploadReferencePanel from "./UploadReferencePanel";
import type { ReferenceImagesByType, SimilarityByType } from "./UploadReferencePanel";
import { getTotalImagesByTypeCount } from "./UploadReferencePanel";
import MobileDrawerPicker from "./MobileDrawerPicker";
import {
  getModelCapabilities,
  getDefaultRatio,
  getDefaultResolution,
  getDefaultStyleId,
  getStyleNameById,
  getStyleResources,
} from "@/config/modelConfig";
import type { ModelConfig } from "@/config/modelConfig";
import { cn } from "@/lib/utils";

/* ── icon entry button ── */
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
  referenceImagesByType?: ReferenceImagesByType;
  onReferenceImagesByTypeChange?: (byType: ReferenceImagesByType) => void;
  similarityByType?: SimilarityByType;
  onSimilarityByTypeChange?: (byType: SimilarityByType) => void;
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
  referenceImagesByType,
  onReferenceImagesByTypeChange,
  similarityByType,
  onSimilarityByTypeChange,
}: MobileParamBarProps) => {
  // Local state (mirrors sidebar pattern)
  const [ratio, setRatioLocal] = useState(getDefaultRatio(selectedModel));
  const [resolution, setResolutionLocal] = useState(getDefaultResolution(selectedModel));
  const [styleId, setStyleIdLocal] = useState<number | null>(getDefaultStyleId(selectedModel));

  // Drawer toggles
  const [modelOpen, setModelOpen] = useState(false);
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

  // Init on mount
  useEffect(() => {
    onRatioChange?.(getDefaultRatio(selectedModel));
    onResolutionChange?.(getDefaultResolution(selectedModel));
    const initStyleId = getDefaultStyleId(selectedModel);
    onStyleChange?.(initStyleId, getStyleNameById(selectedModel, initStyleId));
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
    onRatioChange?.(newRatio);
    onResolutionChange?.(newRes);
    onStyleChange?.(newStyleId, getStyleNameById(selectedModel, newStyleId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel.id]);

  const handleModelChange = (model: ModelConfig) => {
    onModelChange(model);
    setModelOpen(false);
  };

  const caps = getModelCapabilities(selectedModel);
  const showModel = models.length > 1;
  const styleResources = getStyleResources(selectedModel);
  const currentStyleName = styleResources.find((r) => r.id === styleId)?.resource_name ?? "自动";
  const totalUploaded = getTotalImagesByTypeCount(referenceImagesByType ?? {});
  const uploadLabel = totalUploaded > 0 ? `已上传(${totalUploaded})` : "参考图";

  return (
    <div className="lg:hidden px-4 pb-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Model */}
        {showModel && (
          <button
            onClick={() => setModelOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-workspace-border bg-workspace-chip/50 px-2.5 py-2 cursor-pointer hover:bg-workspace-chip transition-colors text-left min-h-[36px]"
          >
            <img src={selectedModel.image} alt={selectedModel.name} className="h-5 w-5 rounded object-cover shrink-0" />
            <span className="text-xs font-medium text-workspace-surface-foreground truncate max-w-[100px]">{selectedModel.name}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        )}

        {/* Ratio */}
        {caps.showRatio && (
          <EntryButton
            icon={Proportions}
            label={ratio}
            active={ratioOpen}
            onClick={() => setRatioOpen(true)}
          />
        )}

        {/* Resolution */}
        {caps.showResolution && (
          <EntryButton
            icon={ScanLine}
            label={resolution}
            active={resolutionOpen}
            onClick={() => setResolutionOpen(true)}
          />
        )}

        {/* Image Count */}
        {caps.showImageCount && (
          <EntryButton
            icon={Hash}
            label={`${imageCount}张`}
            active={countOpen}
            onClick={() => setCountOpen(true)}
          />
        )}

        {/* Style */}
        {caps.showStyle && (
          <EntryButton
            icon={Palette}
            label={currentStyleName}
            active={styleOpen}
            onClick={() => setStyleOpen(true)}
          />
        )}

        {/* Upload Reference */}
        {caps.showUpload && (
          <EntryButton
            icon={ImagePlus}
            label={uploadLabel}
            active={uploadOpen || totalUploaded > 0}
            onClick={() => setUploadOpen(true)}
          />
        )}
      </div>

      {/* ── Drawers ── */}

      {/* Model Drawer */}
      {showModel && (
        <MobileDrawerPicker open={modelOpen} onClose={() => setModelOpen(false)} title="切换模型">
          <div className="flex flex-col gap-1">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelChange(model)}
                className={cn(
                  "flex w-full items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer",
                  model.id === selectedModel.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground",
                )}
              >
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
              <button
                key={opt}
                onClick={() => { setRatio(opt); setRatioOpen(false); }}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-colors cursor-pointer text-left text-sm font-medium",
                  ratio === opt
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </MobileDrawerPicker>
      )}

      {/* Resolution Drawer */}
      {caps.showResolution && (
        <MobileDrawerPicker open={resolutionOpen} onClose={() => setResolutionOpen(false)} title="分辨率">
          <div className="flex flex-col gap-1">
            {selectedModel.resolution.map((r) => (
              <button
                key={r.resolution}
                onClick={() => { setResolution(r.resolution); setResolutionOpen(false); }}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-colors cursor-pointer text-left text-sm font-medium",
                  resolution === r.resolution
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground",
                )}
              >
                {r.resolution}
              </button>
            ))}
          </div>
        </MobileDrawerPicker>
      )}

      {/* Image Count Drawer */}
      {caps.showImageCount && (
        <MobileDrawerPicker open={countOpen} onClose={() => setCountOpen(false)} title="生图数量">
          <div className="flex flex-col gap-1">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => { onImageCountChange(n); setCountOpen(false); }}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-colors cursor-pointer text-left text-sm font-medium",
                  imageCount === n
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground",
                )}
              >
                {n} 张
              </button>
            ))}
          </div>
        </MobileDrawerPicker>
      )}

      {/* Style Drawer */}
      {caps.showStyle && (
        <MobileDrawerPicker open={styleOpen} onClose={() => setStyleOpen(false)} title="风格">
          <div className="flex flex-col gap-1">
            {styleResources.map((res) => (
              <button
                key={res.id}
                onClick={() => { setStyleId(res.id); setStyleOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-left",
                  styleId === res.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground",
                )}
              >
                <img
                  src={res.image}
                  alt={res.resource_name}
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
                <span className="text-sm font-medium truncate">{res.resource_name}</span>
              </button>
            ))}
          </div>
        </MobileDrawerPicker>
      )}

      {/* Upload Reference Drawer */}
      {caps.showUpload && (
        <MobileDrawerPicker open={uploadOpen} onClose={() => setUploadOpen(false)} title="上传参考图">
          <UploadReferencePanel
            key={selectedModel.id}
            model={selectedModel}
            imagesByType={referenceImagesByType}
            onImagesByTypeChange={onReferenceImagesByTypeChange}
            similarityByType={similarityByType}
            onSimilarityByTypeChange={onSimilarityByTypeChange}
          />
        </MobileDrawerPicker>
      )}
    </div>
  );
};

export default MobileParamBar;

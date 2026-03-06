import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Minus, Plus } from "lucide-react";
import ModelSelectCard from "./ModelSelectCard";
import OptionChipGroup from "./OptionChipGroup";
import UploadReferencePanel from "./UploadReferencePanel";
import StyleSelector from "./StyleSelector";
import type { ModelConfig, Provider } from "@/config/modelConfig";
import {
  getModelCapabilities,
  getDefaultRatio,
  getDefaultResolution,
  getDefaultStyleId,
  getStyleNameById,
  getStyleResources,
  DEFAULT_SIMILARITY,
} from "@/config/modelConfig";

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
  selectedModel: ModelConfig;
  onModelChange: (model: ModelConfig) => void;
  models: ModelConfig[];
  providers: Provider[];
  /** 通知父组件当前配置项的附加消耗 */
  onExtraCostChange?: (extra: number) => void;
  /** 生成图片数量 */
  imageCount: number;
  onImageCountChange: (count: number) => void;
  /** 通知父组件当前比例 */
  onRatioChange?: (ratio: string) => void;
  /** 通知父组件当前分辨率 */
  onResolutionChange?: (resolution: string) => void;
  /** 通知父组件当前风格 */
  onStyleChange?: (styleId: number | null, styleName: string) => void;
  /** 通知父组件当前相似度 */
  onSimilarityChange?: (similarity: number) => void;
  /** 受控：参考图列表 */
  referenceImages?: string[];
  /** 受控：参考图变更回调 */
  onReferenceImagesChange?: (images: string[]) => void;
}

const SettingsSidebar = ({ open, onClose, selectedModel, onModelChange, models, providers, onExtraCostChange, imageCount, onImageCountChange, onRatioChange, onResolutionChange, onStyleChange, onSimilarityChange, referenceImages, onReferenceImagesChange }: SettingsSidebarProps) => {
  const [ratio, setRatioLocal] = useState(getDefaultRatio(selectedModel));
  const [selectedResolution, setSelectedResolutionLocal] = useState(getDefaultResolution(selectedModel));
  const [selectedStyleId, setSelectedStyleIdLocal] = useState<number | null>(getDefaultStyleId(selectedModel));
  const [similarity, setSimilarityLocal] = useState(DEFAULT_SIMILARITY);

  const setRatio = (v: string) => { setRatioLocal(v); onRatioChange?.(v); };
  const setSelectedResolution = (v: string) => { setSelectedResolutionLocal(v); onResolutionChange?.(v); };
  const setSelectedStyleId = (id: number | null) => {
    setSelectedStyleIdLocal(id);
    onStyleChange?.(id, getStyleNameById(selectedModel, id));
  };
  const setSimilarity = (v: number | ((prev: number) => number)) => {
    setSimilarityLocal((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      onSimilarityChange?.(next);
      return next;
    });
  };

  // 初始化时通知父组件
  useEffect(() => {
    const initRatio = getDefaultRatio(selectedModel);
    const initRes = getDefaultResolution(selectedModel);
    const initStyleId = getDefaultStyleId(selectedModel);
    onRatioChange?.(initRatio);
    onResolutionChange?.(initRes);
    onStyleChange?.(initStyleId, getStyleNameById(selectedModel, initStyleId));
    onSimilarityChange?.(DEFAULT_SIMILARITY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 计算附加消耗并通知父组件
  useEffect(() => {
    let extra = 0;

    // 分辨率附加价格
    if (selectedModel.resolution_flg === 1) {
      const res = selectedModel.resolution.find((r) => r.resolution === selectedResolution);
      if (res) extra += res.price;
    }

    // 比例附加价格
    if (selectedModel.ratio_flg === 1) {
      extra += selectedModel.ratio_price;
    }

    // 风格附加价格
    if (selectedModel.style_flg === 1) {
      extra += selectedModel.style_price;
    }

    onExtraCostChange?.(extra);
  }, [selectedModel, selectedResolution, ratio, selectedStyleId, onExtraCostChange]);

  const handleModelChange = (model: ModelConfig) => {
    onModelChange(model);
    const newRatio = getDefaultRatio(model);
    const newRes = getDefaultResolution(model);
    const newStyleId = getDefaultStyleId(model);
    setRatioLocal(newRatio);
    setSelectedResolutionLocal(newRes);
    setSelectedStyleIdLocal(newStyleId);
    setSimilarityLocal(DEFAULT_SIMILARITY);
    onRatioChange?.(newRatio);
    onResolutionChange?.(newRes);
    onStyleChange?.(newStyleId, getStyleNameById(model, newStyleId));
    onSimilarityChange?.(DEFAULT_SIMILARITY);
  };

  const caps = getModelCapabilities(selectedModel);
  const styleResources = getStyleResources(selectedModel);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-[300px] overflow-y-auto
          bg-workspace-panel border-r border-workspace-border/30
          workspace-scroll transition-transform duration-300
          lg:relative lg:z-0 lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-5 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-workspace-surface-foreground">图像生成</h2>
            <button onClick={onClose} className="lg:hidden text-workspace-panel-foreground/60 hover:text-workspace-surface-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Model */}
          <Section title="切换模型" extra={
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1.5">
                {providers.slice(0, 3).map((p) => (
                  <img
                    key={p.id}
                    src={p.image}
                    alt={p.name}
                    className="h-5 w-5 rounded-full border border-workspace-border object-cover"
                  />
                ))}
              </div>
              <span className="text-[11px] text-workspace-panel-foreground/50 ml-1">{providers.length}+</span>
            </div>
          }>
            <ModelSelectCard
              models={models}
              selected={selectedModel}
              onSelect={handleModelChange}
            />
          </Section>

          {/* Ratio */}
          {selectedModel.ratio_flg === 1 && selectedModel.ratio.length > 0 && (
            <Section title="比例">
              <OptionChipGroup
                options={selectedModel.ratio}
                selected={ratio}
                onSelect={setRatio}
                maxVisible={4}
              />
            </Section>
          )}

          {/* Resolution */}
          {selectedModel.resolution_flg === 1 && selectedModel.resolution.length > 0 && (
            <Section title="分辨率">
              <OptionChipGroup
                options={selectedModel.resolution.map((r) => r.resolution)}
                selected={selectedResolution}
                onSelect={setSelectedResolution}
              />
            </Section>
          )}

          {/* Image Count */}
          {selectedModel.image_num > 0 && (
            <Section title="生成图片数量">
              <OptionChipGroup
                options={["1", "2", "3", "4"]}
                selected={String(imageCount)}
                onSelect={(v) => onImageCountChange(Number(v))}
              />
            </Section>
          )}

          {/* Style */}
          {selectedModel.style_flg === 1 && styleResources.length > 0 && (
            <Section title="风格">
              <StyleSelector
                resources={styleResources}
                selectedId={selectedStyleId}
                onSelect={setSelectedStyleId}
              />
            </Section>
          )}

          {/* Upload Reference */}
          {selectedModel.image_reference_flg === 1 && (
            <Section title="上传参考图">
              <UploadReferencePanel
                key={selectedModel.id}
                model={selectedModel}
                images={referenceImages}
                onImagesChange={onReferenceImagesChange}
              />
            </Section>
          )}

          {/* Similarity */}
          {hasTypedUpload(selectedModel) && (
            <Section title="相似度" centerTitle>
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
            </Section>
          )}
        </div>
      </aside>
    </>
  );
};

const Section = ({ title, children, extra, centerTitle }: { title: string; children: React.ReactNode; extra?: React.ReactNode; centerTitle?: boolean }) => (
  <div className="space-y-2.5">
    <div className={cn("flex items-center", centerTitle ? "justify-center" : "justify-between")}>
      <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50">
        {title}
      </h3>
      {extra}
    </div>
    {children}
  </div>
);

export default SettingsSidebar;

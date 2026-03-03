import { useState, useEffect } from "react";
import { X, Minus, Plus } from "lucide-react";
import ModelSelectCard from "./ModelSelectCard";
import OptionChipGroup from "./OptionChipGroup";
import UploadReferencePanel from "./UploadReferencePanel";
import StyleSelector from "./StyleSelector";
import type { ModelConfig, Provider } from "@/config/modelConfig";
import { hasTypedUpload } from "@/config/modelConfig";

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
  selectedModel: ModelConfig;
  onModelChange: (model: ModelConfig) => void;
  models: ModelConfig[];
  providers: Provider[];
  /** 通知父组件当前配置项的附加消耗 */
  onExtraCostChange?: (extra: number) => void;
}

const SettingsSidebar = ({ open, onClose, selectedModel, onModelChange, models, providers, onExtraCostChange }: SettingsSidebarProps) => {
  const [ratio, setRatio] = useState(selectedModel.ratio?.[0] ?? "");
  const [selectedResolution, setSelectedResolution] = useState(selectedModel.resolution?.[0]?.resolution ?? "");
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(
    selectedModel.style_flg === 1 ? (selectedModel.style[0]?.resource[0]?.id ?? null) : null
  );
  const [similarity, setSimilarity] = useState(50);

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
    setRatio(model.ratio?.[0] ?? "");
    setSelectedResolution(model.resolution?.[0]?.resolution ?? "");
    setSelectedStyleId(
      model.style_flg === 1 ? (model.style[0]?.resource[0]?.id ?? null) : null
    );
    setSimilarity(50);
  };

  const styleResources = selectedModel.style_flg === 1 ? (selectedModel.style[0]?.resource ?? []) : [];

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

const Section = ({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50">
        {title}
      </h3>
      {extra}
    </div>
    {children}
  </div>
);

export default SettingsSidebar;

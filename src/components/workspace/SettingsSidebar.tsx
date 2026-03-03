import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import ModelSelectCard from "./ModelSelectCard";
import OptionChipGroup from "./OptionChipGroup";
import UploadReferencePanel from "./UploadReferencePanel";
import StyleSelector from "./StyleSelector";
import { getOnlineModels } from "@/config/modelConfig";
import type { ModelConfig } from "@/config/modelConfig";

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
  selectedModel: ModelConfig;
  onModelChange: (model: ModelConfig) => void;
}

const SettingsSidebar = ({ open, onClose, selectedModel, onModelChange }: SettingsSidebarProps) => {
  const models = getOnlineModels();

  const features = selectedModel.features;

  // Local state for selections, reset when model changes
  const [ratio, setRatio] = useState(features.ratios?.[0] ?? "");
  const [resolution, setResolution] = useState(features.resolutions?.[0] ?? "");
  const [count, setCount] = useState(String(features.counts?.[0] ?? "1"));
  const [style, setStyle] = useState(features.styles?.[0] ?? "自动");
  const [similarity, setSimilarity] = useState(50);

  const handleModelChange = (model: ModelConfig) => {
    onModelChange(model);
    const f = model.features;
    setRatio(f.ratios?.[0] ?? "");
    setResolution(f.resolutions?.[0] ?? "");
    setCount(String(f.counts?.[0] ?? "1"));
    setStyle(f.styles?.[0] ?? "自动");
    setSimilarity(50);
  };

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
                {models.slice(0, 3).map((m) => (
                  <span key={m.id} className="flex h-5 w-5 items-center justify-center rounded-full bg-workspace-chip border border-workspace-border text-[10px]">
                    {m.icon}
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-workspace-panel-foreground/50 ml-1">{models.length}+</span>
            </div>
          }>
            <ModelSelectCard
              models={models}
              selected={selectedModel}
              onSelect={handleModelChange}
            />
          </Section>

          {/* Ratio */}
          {features.ratios && features.ratios.length > 0 && (
            <Section title="比例">
              <OptionChipGroup
                options={features.ratios}
                selected={ratio}
                onSelect={setRatio}
                maxVisible={4}
              />
            </Section>
          )}

          {/* Resolution */}
          {features.resolutions && features.resolutions.length > 0 && (
            <Section title="分辨率">
              <OptionChipGroup
                options={features.resolutions}
                selected={resolution}
                onSelect={setResolution}
              />
            </Section>
          )}

          {/* Count */}
          {features.counts && features.counts.length > 0 && (
            <Section title="生成数量">
              <OptionChipGroup
                options={features.counts.map(String)}
                selected={count}
                onSelect={setCount}
              />
            </Section>
          )}

          {/* Style */}
          {features.styles && features.styles.length > 0 && (
            <Section title="风格">
              <StyleSelector
                styles={features.styles}
                selected={style}
                onSelect={setStyle}
              />
            </Section>
          )}

          {/* Upload Reference */}
          {features.uploadRef && (
            <Section title="上传参考图">
              <UploadReferencePanel key={selectedModel.id} config={features.uploadRef} />
            </Section>
          )}

          {/* Similarity */}
          {features.similarity && (
            <Section title="相似度">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSimilarity((prev) => Math.max(0, prev - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 transition-colors"
                >
                  <Minus className="h-4 w-4 text-workspace-panel-foreground" />
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-medium text-workspace-panel-foreground">
                  {similarity}
                </span>
                <button
                  onClick={() => setSimilarity((prev) => Math.min(100, prev + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 transition-colors"
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

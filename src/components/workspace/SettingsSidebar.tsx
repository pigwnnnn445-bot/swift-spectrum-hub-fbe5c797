import { useState, useMemo } from "react";
import { X } from "lucide-react";
import ModelSelectCard from "./ModelSelectCard";
import OptionChipGroup from "./OptionChipGroup";
import UploadReferencePanel from "./UploadReferencePanel";
import StyleSelector from "./StyleSelector";
import { getOnlineModels } from "@/config/modelConfig";
import type { ModelConfig } from "@/config/modelConfig";

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
}

const SettingsSidebar = ({ open, onClose }: SettingsSidebarProps) => {
  const models = useMemo(() => getOnlineModels(), []);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(models[0]);

  const features = selectedModel.features;

  // Local state for selections, reset when model changes
  const [ratio, setRatio] = useState(features.ratios?.[0] ?? "");
  const [resolution, setResolution] = useState(features.resolutions?.[0] ?? "");
  const [count, setCount] = useState(String(features.counts?.[0] ?? "1"));
  const [style, setStyle] = useState(features.styles?.[0] ?? "自动");

  const handleModelChange = (model: ModelConfig) => {
    setSelectedModel(model);
    const f = model.features;
    setRatio(f.ratios?.[0] ?? "");
    setResolution(f.resolutions?.[0] ?? "");
    setCount(String(f.counts?.[0] ?? "1"));
    setStyle(f.styles?.[0] ?? "自动");
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
              <UploadReferencePanel config={features.uploadRef} />
            </Section>
          )}
        </div>
      </aside>
    </>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2.5">
    <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50">
      {title}
    </h3>
    {children}
  </div>
);

export default SettingsSidebar;

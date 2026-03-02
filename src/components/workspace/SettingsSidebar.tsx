import { useState } from "react";
import { X } from "lucide-react";
import ModelSelectCard from "./ModelSelectCard";
import OptionChipGroup from "./OptionChipGroup";
import UploadReferencePanel from "./UploadReferencePanel";

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
}

const SettingsSidebar = ({ open, onClose }: SettingsSidebarProps) => {
  const [ratio, setRatio] = useState("1:1");
  const [count, setCount] = useState("1");
  const [style, setStyle] = useState("Auto");

  return (
    <>
      {/* Mobile overlay */}
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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-workspace-surface-foreground">图像生成</h2>
            </div>
            <button onClick={onClose} className="lg:hidden text-workspace-panel-foreground/60 hover:text-workspace-surface-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Model */}
          <Section title="切换模型">
            <ModelSelectCard
              name="Nano-banana 2"
              subtitle="先进的图像生成模型，输出结果一致性高，细节更清晰，图像更稳定。"
            />
          </Section>

          {/* Ratio */}
          <Section title="比例">
            <OptionChipGroup
              options={["1:1", "4:3", "16:9"]}
              selected={ratio}
              onSelect={setRatio}
              extra={
                <button className="rounded-[10px] border border-workspace-border bg-workspace-chip/30 px-3 py-1.5 text-xs text-workspace-panel-foreground/60 hover:text-workspace-panel-foreground/80 transition-colors">
                  More
                </button>
              }
            />
          </Section>

          {/* Count */}
          <Section title="生成数量">
            <OptionChipGroup
              options={["1", "2", "3", "4"]}
              selected={count}
              onSelect={setCount}
            />
          </Section>

          {/* Style */}
          <Section title="风格">
            <div
              className="flex items-center gap-3 rounded-xl border border-workspace-border bg-workspace-chip/50 p-2.5 cursor-pointer hover:bg-workspace-chip transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-workspace-neon/20 flex items-center justify-center text-xs font-medium text-workspace-surface-foreground">
                Auto
              </div>
              <span className="text-sm text-workspace-panel-foreground/80">{style}</span>
            </div>
          </Section>

          {/* Upload */}
          <Section title="上传参考图">
            <UploadReferencePanel />
          </Section>
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

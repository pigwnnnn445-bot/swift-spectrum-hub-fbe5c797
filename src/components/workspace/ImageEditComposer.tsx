import { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import { Coins } from "lucide-react";
import ModelSelector from "./ModelSelector";
import RatioSelector from "./RatioSelector";
import OptionChipGroup from "./OptionChipGroup";
import StyleSelector from "./StyleSelector";
import { hasTypedUpload } from "@/config/modelConfig";
import type { ModelConfig } from "@/config/modelConfig";
import type { GenerateTask } from "@/types/task";

export interface ComposerPayload {
  editPrompt: string;
  model: ModelConfig;
  ratio: string;
  resolution: string;
  styleId: number | null;
  styleName: string;
  similarity: number;
}

interface ImageEditComposerProps {
  task: GenerateTask;
  models: ModelConfig[];
  onGenerate: (payload: ComposerPayload) => void;
}

const ImageEditComposer = ({ task, models, onGenerate }: ImageEditComposerProps) => {
  const [editPrompt, setEditPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [ratio, setRatio] = useState("");
  const [resolution, setResolution] = useState("");
  const [styleId, setStyleId] = useState<number | null>(null);
  const [similarity, setSimilarity] = useState(50);

  // Initialize from task snapshot — prompt always starts empty
  useEffect(() => {
    setEditPrompt("");
    const m = models.find((m) => m.id === task.modelId) ?? models[0] ?? null;
    setSelectedModel(m);
    if (m) {
      initParamsFromModel(m, task);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  const initParamsFromModel = (model: ModelConfig, t: GenerateTask) => {
    // ratio
    const ratioOptions = model.ratio_flg === 1 ? model.ratio : [];
    setRatio(ratioOptions.includes(t.ratio) ? t.ratio : ratioOptions[0] ?? "1:1");
    // resolution
    const resOptions = model.resolution_flg === 1 ? model.resolution.map((r) => r.resolution) : [];
    setResolution(resOptions.includes(t.resolution) ? t.resolution : resOptions[0] ?? "");
    // style
    if (model.style_flg === 1 && model.style.length > 0) {
      const allRes = model.style.flatMap((tab) => tab.resource);
      const found = allRes.find((r) => r.id === t.styleId);
      setStyleId(found ? t.styleId ?? null : allRes[0]?.id ?? null);
    } else {
      setStyleId(null);
    }
    // similarity
    setSimilarity(t.similarity ?? 50);
  };

  const handleModelChange = (model: ModelConfig) => {
    setSelectedModel(model);
    initParamsFromModel(model, task);
  };

  const handleSubmit = () => {
    if (!selectedModel || !editPrompt.trim()) return;
    const allRes = selectedModel.style.flatMap((t) => t.resource);
    const styleName = allRes.find((r) => r.id === styleId)?.resource_name ?? "";
    onGenerate({
      editPrompt: editPrompt.trim(),
      model: selectedModel,
      ratio,
      resolution,
      styleId,
      styleName,
      similarity,
    });
  };

  if (!selectedModel) return null;

  const styleResources = selectedModel.style_flg === 1 ? (selectedModel.style[0]?.resource ?? []) : [];
  const showRatio = selectedModel.ratio_flg === 1 && selectedModel.ratio.length > 0;
  const showResolution = selectedModel.resolution_flg === 1 && selectedModel.resolution.length > 0;
  const showStyle = selectedModel.style_flg === 1 && styleResources.length > 0;
  const showSimilarity = hasTypedUpload(selectedModel);

  const totalCost = selectedModel.price;

  return (
    <div className="border-t border-workspace-border bg-workspace-panel px-4 py-3 space-y-3">
      {/* Textarea */}
      <textarea
        value={editPrompt}
        onChange={(e) => setEditPrompt(e.target.value)}
        placeholder="描述您想要修复的内容。如果为空，则结果将基于原始图像自动编辑。"
        className="w-full resize-none rounded-lg border border-workspace-border bg-workspace-surface px-3 py-2 text-sm text-workspace-surface-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] max-h-[120px] prompt-textarea"
        rows={2}
      />

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <ModelSelector models={models} selected={selectedModel} onSelect={handleModelChange} />

        {showRatio && (
          <RatioSelector options={selectedModel.ratio} selected={ratio} onSelect={setRatio} />
        )}

        {showResolution && (
          <div className="flex items-center gap-1.5">
            {selectedModel.resolution.map((r) => (
              <button
                key={r.resolution}
                onClick={() => setResolution(r.resolution)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer ${
                  resolution === r.resolution
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border hover:bg-workspace-chip"
                }`}
              >
                {r.resolution}
              </button>
            ))}
          </div>
        )}

        {showStyle && (
          <div className="min-w-[160px]">
            <StyleSelector resources={styleResources} selectedId={styleId} onSelect={setStyleId} />
          </div>
        )}

        {showSimilarity && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>相似度</span>
            <input
              type="range"
              min={0}
              max={100}
              value={similarity}
              onChange={(e) => setSimilarity(Number(e.target.value))}
              className="w-20 accent-primary"
            />
            <span className="text-workspace-panel-foreground w-7 text-right">{similarity}</span>
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
};

export default ImageEditComposer;

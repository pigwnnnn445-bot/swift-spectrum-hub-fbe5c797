import { useState, useEffect } from "react";
import { Coins, Minus, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ModelSelectCard from "./ModelSelectCard";
import RatioSelector from "./RatioSelector";
import OptionChipGroup from "./OptionChipGroup";
import StyleSelector from "./StyleSelector";
import type { ModelConfig } from "@/config/modelConfig";
import type { GenerateTask } from "@/types/task";

interface ImageEditComposerProps {
  task: GenerateTask;
  models: ModelConfig[];
  onGenerate: (payload: {
    editPrompt: string;
    modelId: number;
    modelName: string;
    modelImage: string;
    ratio: string;
    resolution: string;
    styleName?: string;
    styleId?: number | null;
    similarity?: number;
    baseImageUrl: string;
  }) => void;
  isSubmitting?: boolean;
  baseImageUrl: string;
}

const ImageEditComposer = ({ task, models, onGenerate, isSubmitting, baseImageUrl }: ImageEditComposerProps) => {
  // Find model from models list matching task snapshot
  const initialModel = models.find((m) => m.id === task.modelId) ?? models[0];

  const [selectedModel, setSelectedModel] = useState<ModelConfig>(initialModel);
  const [editPrompt, setEditPrompt] = useState("");
  const [ratio, setRatio] = useState(task.ratio || selectedModel?.ratio?.[0] || "1:1");
  const [resolution, setResolution] = useState(task.resolution || selectedModel?.resolution?.[0]?.resolution || "");
  const [styleId, setStyleId] = useState<number | null>(task.styleId ?? null);
  const [similarity, setSimilarity] = useState(task.similarity ?? 50);

  // Reset params when task snapshot changes (history rail click)
  useEffect(() => {
    const model = models.find((m) => m.id === task.modelId) ?? models[0];
    if (model) {
      setSelectedModel(model);
      setRatio(task.ratio || model.ratio?.[0] || "1:1");
      setResolution(task.resolution || model.resolution?.[0]?.resolution || "");
      setStyleId(task.styleId ?? (model.style_flg === 1 ? (model.style[0]?.resource[0]?.id ?? null) : null));
      setSimilarity(task.similarity ?? 50);
    }
    setEditPrompt("");
  }, [task.id, task.modelId, models]);

  const handleModelChange = (model: ModelConfig) => {
    setSelectedModel(model);
    setRatio(model.ratio?.[0] || "1:1");
    setResolution(model.resolution?.[0]?.resolution || "");
    setStyleId(model.style_flg === 1 ? (model.style[0]?.resource[0]?.id ?? null) : null);
    setSimilarity(50);
  };

  const styleResources = selectedModel.style_flg === 1 ? (selectedModel.style[0]?.resource ?? []) : [];
  const selectedStyleName = styleResources.find((r) => r.id === styleId)?.resource_name;

  const handleSubmit = () => {
    onGenerate({
      editPrompt: editPrompt.trim() || task.prompt,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      modelImage: selectedModel.image,
      ratio,
      resolution,
      styleName: selectedStyleName,
      styleId,
      similarity,
      baseImageUrl,
    });
  };

  return (
    <div className="space-y-4">
      {/* Prompt textarea */}
      <Textarea
        value={editPrompt}
        onChange={(e) => setEditPrompt(e.target.value)}
        placeholder="输入新的提示词继续生成（留空则沿用原始提示词）..."
        className="min-h-[80px] bg-workspace-chip/50 border-workspace-border text-workspace-surface-foreground placeholder:text-workspace-panel-foreground/40 resize-none prompt-textarea"
      />

      {/* Model + dynamic params */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-workspace-panel-foreground/50">模型</label>
          <ModelSelectCard models={models} selected={selectedModel} onSelect={handleModelChange} />
        </div>

        {/* Ratio */}
        {selectedModel.ratio_flg === 1 && selectedModel.ratio.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-workspace-panel-foreground/50">比例</label>
            <RatioSelector options={selectedModel.ratio} selected={ratio} onSelect={setRatio} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resolution */}
        {selectedModel.resolution_flg === 1 && selectedModel.resolution.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-workspace-panel-foreground/50">分辨率</label>
            <OptionChipGroup
              options={selectedModel.resolution.map((r) => r.resolution)}
              selected={resolution}
              onSelect={setResolution}
            />
          </div>
        )}

        {/* Style */}
        {selectedModel.style_flg === 1 && styleResources.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-workspace-panel-foreground/50">风格</label>
            <StyleSelector resources={styleResources} selectedId={styleId} onSelect={setStyleId} />
          </div>
        )}
      </div>

      {/* Similarity (if model supports) */}
      {selectedModel.image_like_flg === 1 && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-workspace-panel-foreground/50">相似度</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSimilarity((p) => Math.max(0, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors"
            >
              <Minus className="h-4 w-4 text-workspace-panel-foreground" />
            </button>
            <span className="min-w-[2.5rem] text-center text-sm font-medium text-workspace-panel-foreground">{similarity}</span>
            <button
              onClick={() => setSimilarity((p) => Math.min(100, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4 text-workspace-panel-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Generate button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="gap-2"
        >
          <span>Generate</span>
          <Coins className="h-4 w-4 opacity-60" />
          <span className="text-xs opacity-70">{selectedModel.price}</span>
        </Button>
      </div>
    </div>
  );
};

export default ImageEditComposer;

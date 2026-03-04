import { useState } from "react";
import { RotateCw, AlertCircle, ChevronDown, ChevronUp, Copy, ArrowUp, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenerateTask } from "@/types/task";

interface TaskCardProps {
  task: GenerateTask;
  onRetry?: (taskId: string) => void;
}

const TaskCard = ({ task, onRetry }: TaskCardProps) => {
  const isGenerating = task.status === "generating" || task.status === "submitting";
  const isError = task.status === "error";
  const isSuccess = task.status === "success";
  const hasReferenceImages = (task.referenceImages?.length ?? 0) > 0;

  const [promptExpanded, setPromptExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-workspace-border/60 bg-workspace-surface overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* 左侧：图片区域 */}
        <div className="flex-1 min-w-0">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns:
                task.count <= 1
                  ? "1fr"
                  : task.count === 2
                  ? "1fr 1fr"
                  : "repeat(auto-fill, minmax(180px, 1fr))",
            }}
          >
            {isGenerating &&
              Array.from({ length: task.count }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="aspect-square w-full rounded-lg bg-workspace-chip animate-pulse"
                />
              ))}

            {isSuccess &&
              task.images.map((src, i) => (
                <div
                  key={i}
                  className={`relative group overflow-hidden rounded-lg ${
                    task.count === 1 ? "max-w-md mx-auto w-full" : ""
                  }`}
                >
                  <img
                    src={src}
                    alt={`生成结果 ${i + 1}`}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                </div>
              ))}

            {isError && (
              <div className="flex aspect-square items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <AlertCircle className="h-8 w-8 text-destructive/70" />
                  <p className="text-sm text-destructive/80">{task.errorMessage || "生成失败"}</p>
                  <button
                    onClick={() => onRetry?.(task.id)}
                    className="mt-1 flex items-center gap-1.5 rounded-lg bg-workspace-chip px-3 py-1.5 text-xs font-medium text-workspace-surface-foreground hover:bg-workspace-chip-active/20 transition-colors"
                  >
                    <RotateCw className="h-3 w-3" />
                    重试
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：任务信息 */}
        <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-3">
          {/* A. 提示词 + 占位图标 */}
          <div className="flex flex-col gap-1">
            <div className="relative">
              <p
                className={`text-sm text-workspace-surface-foreground leading-relaxed pr-14 ${
                  promptExpanded ? "" : "line-clamp-6"
                }`}
              >
                {task.prompt}
              </p>
              {/* 右上角占位图标（纯展示，不绑定交互） */}
              <div className="absolute top-0 right-0 flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50">
                  <Copy className="h-3.5 w-3.5" />
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50">
                  <ArrowUp className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
            {task.prompt.length > 200 && (
              <button
                onClick={() => setPromptExpanded((v) => !v)}
                className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-workspace-surface-foreground transition-colors"
              >
                {promptExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> 收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> 展开
                  </>
                )}
              </button>
            )}
          </div>

          {/* B + C. 模型 + 比例标签 */}
          <div className="flex flex-wrap items-center gap-2">
            {task.modelName && (
              <span className="flex items-center gap-1.5 rounded-full bg-workspace-chip px-2.5 py-1 text-xs text-workspace-panel-foreground">
                <img src={task.modelImage} alt="" className="h-4 w-4 rounded-full object-cover" />
                {task.modelName}
              </span>
            )}
            {task.ratio && (
              <span className="flex items-center gap-1 rounded-full bg-workspace-chip px-2.5 py-1 text-xs text-workspace-panel-foreground">
                □ {task.ratio}
              </span>
            )}
            {isGenerating && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                <RotateCw className="h-3 w-3 animate-spin" />
                生成中...
              </span>
            )}
          </div>

          {/* D. 图生图标签 */}
          {hasReferenceImages && (
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1 self-start rounded-full bg-workspace-chip px-2.5 py-1 text-xs text-workspace-panel-foreground">
                <ImageIcon className="h-3 w-3" />
                Image to image
              </span>

              {/* E. 参考图缩略图 */}
              <div className="flex flex-wrap gap-2">
                {task.referenceImages!.map((src, i) => (
                  <div
                    key={i}
                    className="h-12 w-12 overflow-hidden rounded-lg border border-workspace-border/40"
                  >
                    <img
                      src={src}
                      alt={`参考图 ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;

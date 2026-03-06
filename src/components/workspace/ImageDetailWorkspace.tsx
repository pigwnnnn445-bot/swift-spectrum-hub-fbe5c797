import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import ImageDetailRightPanel from "./ImageDetailRightPanel";
import ImageHistoryRail from "./ImageHistoryRail";
import ImageEditComposer from "./ImageEditComposer";
import type { HistoryImageItem } from "./ImageHistoryRail";
import type { ComposerPayload } from "./ImageEditComposer";
import type { GenerateTask } from "@/types/task";
import type { ModelConfig } from "@/config/modelConfig";

interface ImageDetailWorkspaceProps {
  /** The image URL that was clicked to open this view */
  initialImageUrl: string;
  /** The index of the clicked image within its task */
  initialImageIndex: number;
  /** The task that owns the clicked image */
  initialTask: GenerateTask;
  /** All tasks (for history rail) */
  tasks: GenerateTask[];
  /** All available models */
  models: ModelConfig[];
  /** Called when Generate is clicked */
  onGenerate: (payload: ComposerPayload) => void;
  /** Called to close this view */
  onClose: () => void;
}

/** Summarize prompt into a short title (12-20 chars) */
function summarizePrompt(prompt: string): string {
  // Take first meaningful segment, strip punctuation, limit length
  const clean = prompt
    .replace(/[，。！？、；：""''（）【】《》\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = clean.split(" ").filter(Boolean);
  let result = "";
  for (const w of words) {
    if ((result + w).length > 20) break;
    result += (result ? " " : "") + w;
  }
  return result || clean.slice(0, 20);
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

const ImageDetailWorkspace = ({
  initialImageUrl,
  initialTask,
  tasks,
  models,
  onGenerate,
  onClose,
}: ImageDetailWorkspaceProps) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState(initialImageUrl);
  const [selectedTask, setSelectedTask] = useState(initialTask);

  // When initial props change (shouldn't normally), sync
  useEffect(() => {
    setSelectedImageUrl(initialImageUrl);
    setSelectedTask(initialTask);
  }, [initialImageUrl, initialTask]);

  const handleHistorySelect = useCallback((item: HistoryImageItem) => {
    setSelectedImageUrl(item.imageUrl);
    setSelectedTask(item.task);
  }, []);

  const fileName = useMemo(() => {
    const date = formatDate(selectedTask.createdAt);
    const summary = summarizePrompt(selectedTask.prompt);
    return `Rita_${date}_作品_${summary}`;
  }, [selectedTask]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-workspace-panel">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-workspace-border shrink-0">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-workspace-chip transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-workspace-surface-foreground" />
        </button>
        <h1 className="text-sm font-medium text-workspace-surface-foreground truncate">{fileName}</h1>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Center: big image + right panel */}
        <div className="flex flex-1 min-w-0 overflow-hidden">
          {/* Big image */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto min-w-0">
            <img
              src={selectedImageUrl}
              alt="大图预览"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Right attributes panel */}
          <div className="w-[280px] shrink-0 border-l border-workspace-border p-4 overflow-y-auto workspace-scroll hidden lg:block">
            <ImageDetailRightPanel task={selectedTask} />
          </div>
        </div>

        {/* Far right: history rail */}
        <div className="w-[72px] shrink-0 border-l border-workspace-border overflow-y-auto workspace-scroll hidden md:flex flex-col items-center py-2">
          <ImageHistoryRail
            tasks={tasks}
            selectedImageUrl={selectedImageUrl}
            onSelect={handleHistorySelect}
          />
        </div>
      </div>

      {/* Bottom composer */}
      <ImageEditComposer
        key={selectedTask.id}
        task={selectedTask}
        models={models}
        onGenerate={onGenerate}
      />
    </div>
  );
};

export default ImageDetailWorkspace;

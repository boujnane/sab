"use client";

import { useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import type { ChapterStatus } from "@/lib/progress";
import { reorderChapter } from "@/lib/actions/chapters";
import { StatusStepper } from "@/components/status-stepper";

interface ChapterRowProps {
  id: string;
  name: string;
  status: ChapterStatus;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function ChapterRow({
  id,
  name,
  status,
  canMoveUp,
  canMoveDown,
}: ChapterRowProps) {
  const [, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await reorderChapter(id, direction);
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 border-b border-plum-200 px-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <StatusStepper chapterId={id} chapterName={name} status={status} />
      </div>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={!canMoveUp}
          onClick={() => move("up")}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-plum-500 hover:bg-plum-100 hover:text-plum-950 disabled:pointer-events-none disabled:opacity-30"
          aria-label={`Monter ${name}`}
        >
          <ChevronUp size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          disabled={!canMoveDown}
          onClick={() => move("down")}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-plum-500 hover:bg-plum-100 hover:text-plum-950 disabled:pointer-events-none disabled:opacity-30"
          aria-label={`Descendre ${name}`}
        >
          <ChevronDown size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

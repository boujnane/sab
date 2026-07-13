import type { Pace } from "@/lib/progress";
import { paceLabel } from "@/lib/progress";
import { cn } from "@/lib/utils";

const PACE_COLOR: Record<Pace["kind"], string> = {
  ahead: "text-ciel-600",
  behind: "text-petale-600",
  on_track: "text-plum-600",
  done: "text-plum-600",
};

export function PaceBadge({ pace, className }: { pace: Pace; className?: string }) {
  return (
    <span className={cn("font-mono text-xs", PACE_COLOR[pace.kind], className)}>
      {paceLabel(pace)}
    </span>
  );
}

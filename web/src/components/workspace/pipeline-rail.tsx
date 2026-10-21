import { PIPELINE_STAGES, type PipelineStage } from "@/lib/cse/types";
import { stageLabel } from "@/lib/cse/format";
import { cn } from "@/lib/cn";

export function PipelineRail({ stage, compact }: { stage: PipelineStage | string; compact?: boolean }) {
  const idx = PIPELINE_STAGES.indexOf(stage as PipelineStage);
  const current = idx < 0 ? 0 : idx;
  return (
    <ol className={cn("flex", compact ? "gap-1" : "flex-col gap-3")}>
      {PIPELINE_STAGES.map((s, i) => {
        const done = i < current || stage === "complete";
        const active = s === stage || (stage === "complete" && s === "complete");
        return (
          <li key={s} className={cn("flex items-center gap-3", compact && "flex-1")}>
            <span
              className={cn(
                "grid size-2 shrink-0 rounded-full",
                done || active ? "bg-primary" : "bg-border-strong",
                active && stage !== "complete" && "ring-4 ring-primary/20",
              )}
            />
            {!compact && (
              <span className={cn("text-sm", active ? "text-fg" : "text-subtle")}>{stageLabel(s)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

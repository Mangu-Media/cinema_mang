import { useMemo } from "react";
import { splitScenes } from "@/lib/cse/parser";
import { cn } from "@/lib/cn";
import type { SceneRow } from "@/lib/cse/types";

export function ScriptView({
  script,
  scenes,
  selectedIndex,
  onSelect,
}: {
  script: string;
  scenes: SceneRow[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}) {
  const parsed = useMemo(() => splitScenes(script), [script]);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-[var(--radius-lg)] bg-bg-elevated p-3 shadow-[var(--shadow-border)] lg:p-4">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.16em] text-subtle">Scenes</div>
        <ul className="flex max-h-[240px] flex-col gap-1 overflow-auto lg:max-h-[calc(100dvh-220px)]">
          {(scenes.length ? scenes : parsed.map((s) => ({ scene_index: s.scene_index, heading: s.heading }))).map(
            (s) => {
              const active = s.scene_index === selectedIndex;
              return (
                <li key={s.scene_index}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(s.scene_index)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left text-xs transition-colors",
                      active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface hover:text-fg",
                    )}
                  >
                    <span className="font-mono tabular text-[10px] text-subtle">{s.scene_index}</span>
                    <span className="leading-snug">{s.heading}</span>
                  </button>
                </li>
              );
            },
          )}
        </ul>
      </aside>
      <article className="rounded-[var(--radius-xl)] bg-[#f4efe4] px-5 py-8 text-[#1c1a16] shadow-[var(--shadow-border)] sm:px-12 sm:py-12">
        <div className="mx-auto max-w-[42rem] font-sans text-[15px] leading-[1.7]">
          {parsed.map((scene) => (
            <section
              key={scene.scene_index}
              id={`scene-${scene.scene_index}`}
              className={cn(
                "mb-10 scroll-mt-24",
                selectedIndex === scene.scene_index && "ring-1 ring-[#1c1a16]/15 rounded-md px-3 py-2",
              )}
            >
              <h3 className="mb-4 text-center text-[13px] font-semibold tracking-[0.04em]">
                {scene.heading}
              </h3>
              {scene.action.map((line, i) => (
                <p key={`a-${i}`} className="mb-3">
                  {line}
                </p>
              ))}
              {scene.dialogue_blocks.map((d, i) => (
                <div key={`d-${i}`} className="mx-auto mb-4 max-w-[22rem] text-center">
                  <div className="text-[13px] font-semibold tracking-wide">{d.character}</div>
                  {d.parenthetical ? <div className="text-[12px] italic text-[#5c574c]">{d.parenthetical}</div> : null}
                  <p className="mt-1 text-[15px]">{d.lines}</p>
                </div>
              ))}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

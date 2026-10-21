import { Link } from "@tanstack/react-router";
import type { KeyboardEvent } from "react";
import type { StreamTitle } from "@/lib/stream/types";
import { TitleCard } from "./title-card";

export function TitleRow({
  label,
  subtitle,
  titles,
  progress,
  collectionId,
  large,
  onDismiss,
  ranked,
}: {
  label: string;
  subtitle?: string;
  titles: StreamTitle[];
  progress?: Record<string, number>;
  collectionId?: string;
  large?: boolean;
  onDismiss?: (id: string) => void;
  ranked?: boolean;
}) {
  if (!titles.length) return null;
  const useLarge = Boolean(large || ranked || onDismiss);

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const cards = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-title-card]")];
    const current = (e.target as HTMLElement).closest("[data-title-card]");
    const i = current ? cards.indexOf(current as HTMLElement) : -1;
    if (i < 0) return;
    const next = e.key === "ArrowRight" ? cards[i + 1] : cards[i - 1];
    if (!next) return;
    e.preventDefault();
    next.querySelector<HTMLElement>("a")?.focus();
    next.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between px-4 md:px-8">
        <div>
          <h2 className="font-display text-2xl tracking-tight">{label}</h2>
          {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
        </div>
        {collectionId ? (
          <Link
            to="/watch/browse/$row"
            params={{ row: collectionId }}
            className="text-xs uppercase tracking-[0.14em] text-muted hover:text-fg"
          >
            See all
          </Link>
        ) : null}
      </div>
      <div
        className="row-scroll flex gap-3 overflow-x-auto px-4 pb-2 md:px-8"
        onKeyDown={onKey}
        role="list"
        aria-label={label}
      >
        {titles.map((t, i) => (
          <TitleCard
            key={t.id}
            title={t}
            progress={progress?.[t.id]}
            large={useLarge}
            onDismiss={onDismiss}
            rank={ranked ? i + 1 : undefined}
          />
        ))}
      </div>
    </section>
  );
}

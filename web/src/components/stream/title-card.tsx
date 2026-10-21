import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Play, Plus, X } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { canPlay } from "@/lib/stream/catalog";
import { isWatched } from "@/lib/stream/catalog-query";
import { formatRuntime, remainingLabel } from "@/lib/stream/format";
import type { StreamTitle } from "@/lib/stream/types";
import { toggleList, useWatchState } from "@/lib/stream/watch-state";
import { PosterImg } from "./poster-img";

export function TitleCard({
  title,
  progress,
  large,
  fill,
  onDismiss,
  rank,
}: {
  title: StreamTitle;
  progress?: number;
  large?: boolean;
  fill?: boolean;
  onDismiss?: (id: string) => void;
  rank?: number;
}) {
  const navigate = useNavigate();
  const state = useWatchState();
  const trailerRef = useRef<HTMLVideoElement>(null);
  const saved = state.progress[title.id];
  const ratio =
    progress ??
    (saved && saved.duration > 0 ? saved.seconds / saved.duration : undefined);
  const showBar = ratio != null && ratio > 0 && ratio < 0.95;
  const watched = saved ? isWatched(saved.seconds, saved.duration) : false;
  const playable = canPlay(title);
  const inList = state.list.includes(title.id);
  const peek = Boolean(title.trailer);

  function playPeek() {
    const v = trailerRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => undefined);
  }

  function stopPeek() {
    const v = trailerRef.current;
    if (!v) return;
    v.pause();
  }

  return (
    <div
      data-title-card
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-md)] bg-surface shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)] hover:z-10 hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)]",
        fill ? "w-full min-w-0" : "shrink-0",
        !fill && (large ? "w-[260px] sm:w-[320px]" : "w-[148px] sm:w-[176px]"),
      )}
      onMouseEnter={peek ? playPeek : undefined}
      onMouseLeave={peek ? stopPeek : undefined}
      onFocusCapture={peek ? playPeek : undefined}
      onBlurCapture={(e) => {
        if (!peek) return;
        if (!e.currentTarget.contains(e.relatedTarget as Node)) stopPeek();
      }}
    >
      <Link to="/watch/title/$titleId" params={{ titleId: title.id }} className="block">
        <div className={cn("relative bg-surface-2", large ? "aspect-video" : "aspect-[2/3]")}>
          <PosterImg
            src={large ? title.backdrop : title.poster}
            title={title.title}
            year={title.year}
            wide={large}
            className="outline outline-1 -outline-offset-1 outline-white/10 transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {peek ? (
            <video
              ref={trailerRef}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
              src={title.trailer}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/10 to-transparent" />
          {rank != null ? (
            <span
              className="absolute bottom-1 left-1 font-display text-6xl leading-none text-fg/90 sm:text-7xl"
              aria-label={`Number ${rank}`}
            >
              {rank}
            </span>
          ) : null}
          {title.badge || watched ? (
            <span className="absolute left-2 top-2">
              <Badge tone={title.origin === "original" ? "solid" : "muted"}>
                {watched ? "Watched" : title.badge}
              </Badge>
            </span>
          ) : null}
          {showBar ? (
            <span className="absolute inset-x-2 bottom-1 h-0.5 overflow-hidden rounded-full bg-fg/20">
              <span className="block h-full bg-primary" style={{ width: `${Math.round((ratio ?? 0) * 100)}%` }} />
            </span>
          ) : null}
        </div>
        <div className="px-2.5 py-2">
          <div className="truncate text-sm">{title.title}</div>
          <div className="truncate text-[11px] text-subtle">
            {title.year} · {formatRuntime(title.runtimeMin)}
            {showBar ? ` · ${remainingLabel(ratio ?? 0, title.runtimeMin)}` : null}
          </div>
          <p className="mt-1 hidden text-[11px] leading-snug text-muted group-hover:line-clamp-2 group-focus-within:line-clamp-2 sm:block sm:max-h-0 sm:overflow-hidden sm:group-hover:max-h-10 sm:group-focus-within:max-h-10">
            {title.tagline}
          </p>
        </div>
      </Link>
      {playable ? (
        <button
          type="button"
          className="absolute bottom-14 right-2 z-10 flex size-11 items-center justify-center rounded-full bg-primary text-primary-fg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
          aria-label={`Play ${title.title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void navigate({ to: "/watch/play/$titleId", params: { titleId: title.id } });
          }}
        >
          <Play className="size-3.5 fill-current" />
        </button>
      ) : null}
      <button
        type="button"
        className="absolute bottom-14 right-14 z-10 flex size-11 items-center justify-center rounded-full bg-bg/80 text-fg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        aria-label={inList ? `Remove ${title.title} from my list` : `Add ${title.title} to my list`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleList(title.id);
        }}
      >
        {inList ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
      </button>
      {onDismiss ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-bg/80 text-fg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          aria-label={`Remove ${title.title} from continue watching`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss(title.id);
          }}
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

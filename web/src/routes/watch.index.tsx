import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HeroBillboard } from "@/components/stream/hero-billboard";
import { StreamFooter } from "@/components/stream/stream-footer";
import { TitleRow } from "@/components/stream/title-row";
import { TonightRail } from "@/components/stream/tonight-rail";
import { WatchShell } from "@/components/stream/watch-shell";
import { featuredTitles, getTitle, titlesForRow } from "@/lib/stream/catalog";
import { allDecades, progressRatio } from "@/lib/stream/catalog-query";
import { becauseYouLiked, becauseYouWatched } from "@/lib/stream/recommend";
import { STREAM_GENRES, STREAM_ROWS } from "@/lib/stream/types";
import { clearProgress, continueWatching, useWatchState } from "@/lib/stream/watch-state";

export const Route = createFileRoute("/watch/")({ component: WatchHome });

function WatchHome() {
  const featured = featuredTitles();
  const [heroIndex, setHeroIndex] = useState(0);
  const state = useWatchState();
  const decades = allDecades();

  useEffect(() => {
    if (featured.length < 2) return;
    const t = window.setInterval(() => setHeroIndex((i) => (i + 1) % featured.length), 14000);
    return () => window.clearInterval(t);
  }, [featured.length]);

  const hero = featured[heroIndex] ?? featured[0];
  const cont = useMemo(() => {
    return continueWatching(state)
      .map((p) => {
        const title = getTitle(p.titleId);
        if (!title) return null;
        return { title, progress: progressRatio(p.seconds, p.duration) };
      })
      .filter((x): x is { title: NonNullable<ReturnType<typeof getTitle>>; progress: number } => Boolean(x));
  }, [state]);

  const progressMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of Object.values(state.progress)) map[p.titleId] = progressRatio(p.seconds, p.duration);
    return map;
  }, [state]);

  const because = useMemo(() => becauseYouWatched(state), [state]);
  const liked = useMemo(() => becauseYouLiked(state), [state]);

  return (
    <WatchShell>
      {hero ? <HeroBillboard key={hero.id} title={hero} /> : null}
      <div className="-mt-10 relative z-10 md:-mt-14">
        {cont.length ? (
          <TitleRow
            label="Continue watching"
            titles={cont.map((c) => c.title)}
            progress={progressMap}
            collectionId="continue"
            large
            onDismiss={(id) => clearProgress(id)}
          />
        ) : null}
        {because ? (
          <TitleRow
            label={`Because you watched ${because.seed.title}`}
            titles={because.recs}
            progress={progressMap}
            large
          />
        ) : null}
        {liked && liked.seed.id !== because?.seed.id ? (
          <TitleRow
            label={`Because you liked ${liked.seed.title}`}
            titles={liked.recs}
            progress={progressMap}
            large
          />
        ) : null}
        <TonightRail />
        <div className="mb-8 px-4 md:px-8">
          <h2 className="mb-3 font-display text-2xl tracking-tight">Browse genres</h2>
          <div className="flex flex-wrap gap-2">
            {STREAM_GENRES.map((g) => (
              <Link
                key={g}
                to="/watch/browse/$row"
                params={{ row: g }}
                className="flex h-11 items-center rounded-full bg-surface-2 px-4 text-xs uppercase tracking-[0.12em] text-muted hover:text-fg"
              >
                {g}
              </Link>
            ))}
          </div>
          <h2 className="mb-3 mt-8 font-display text-2xl tracking-tight">By decade</h2>
          <div className="flex flex-wrap gap-2">
            {decades.map((d) => (
              <Link
                key={d}
                to="/watch/browse/$row"
                params={{ row: d }}
                className="flex h-11 items-center rounded-full bg-surface-2 px-4 text-xs uppercase tracking-[0.12em] text-muted hover:text-fg"
              >
                {d}
              </Link>
            ))}
            <Link
              to="/watch/catalog"
              className="flex h-11 items-center rounded-full bg-surface px-4 text-xs uppercase tracking-[0.12em] text-fg hover:text-primary"
            >
              Whole vault
            </Link>
          </div>
        </div>
        {STREAM_ROWS.filter((r) => r.id !== "continue" && r.id !== "tonight").map((row) => (
          <TitleRow
            key={row.id}
            label={row.label}
            subtitle={row.subtitle}
            titles={titlesForRow(row.id)}
            progress={progressMap}
            collectionId={row.id}
            large={row.id === "originals" || row.id === "trending" || row.id === "new"}
            ranked={row.id === "top10"}
          />
        ))}
      </div>
      <StreamFooter />
    </WatchShell>
  );
}

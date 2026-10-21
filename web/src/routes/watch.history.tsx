import { createFileRoute, Link } from "@tanstack/react-router";
import { StreamFooter } from "@/components/stream/stream-footer";
import { WatchShell } from "@/components/stream/watch-shell";
import { Button } from "@/components/ui/button";
import { getTitle } from "@/lib/stream/catalog";
import { formatClock } from "@/lib/stream/format";
import { clearProgress, useWatchState, watchHistory } from "@/lib/stream/watch-state";

export const Route = createFileRoute("/watch/history")({ component: HistoryPage });

function HistoryPage() {
  const state = useWatchState();
  const items = watchHistory(state)
    .map((p) => {
      const title = getTitle(p.titleId);
      return title ? { title, progress: p } : null;
    })
    .filter((x): x is { title: NonNullable<ReturnType<typeof getTitle>>; progress: (typeof state.progress)[string] } =>
      Boolean(x),
    );

  return (
    <WatchShell>
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">History</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">What you opened.</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">
          Stored on this device. Remove a title to drop it from Continue watching.
        </p>
        {items.length ? (
          <ul className="mt-8 divide-y divide-border overflow-hidden rounded-[var(--radius-xl)] bg-bg-elevated shadow-[var(--shadow-border)]">
            {items.map(({ title, progress }) => {
              const pct = progress.duration ? Math.min(100, Math.round((progress.seconds / progress.duration) * 100)) : 0;
              return (
                <li key={title.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Link
                    to="/watch/title/$titleId"
                    params={{ titleId: title.id }}
                    className="min-w-0 flex-1 hover:text-primary"
                  >
                    <span className="block truncate">{title.title}</span>
                    <span className="text-xs text-subtle">
                      {title.year} · {formatClock(progress.seconds)} / {formatClock(progress.duration)} · {pct}%
                    </span>
                  </Link>
                  <Button variant="outline" asChild>
                    <Link to="/watch/play/$titleId" params={{ titleId: title.id }}>
                      Resume
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={() => clearProgress(title.id)}>
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-12 max-w-md rounded-[var(--radius-xl)] bg-bg-elevated p-6 shadow-[var(--shadow-border)]">
            <p className="font-display text-2xl">No prints started.</p>
            <p className="mt-2 text-sm text-muted">Play anything and it will land here.</p>
            <Button className="mt-5" asChild>
              <Link to="/watch">Browse Watch</Link>
            </Button>
          </div>
        )}
      </main>
      <StreamFooter />
    </WatchShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CatalogGrid } from "@/components/stream/catalog-grid";
import { StreamFooter } from "@/components/stream/stream-footer";
import { TitleCard } from "@/components/stream/title-card";
import { WatchShell } from "@/components/stream/watch-shell";
import { Button } from "@/components/ui/button";
import { getTitle, rowMeta, titlesForRow } from "@/lib/stream/catalog";
import { decadeOf, parseDecade } from "@/lib/stream/catalog-query";
import { formatClockMin, formatRuntime } from "@/lib/stream/format";
import { sortTitles, type BrowseSort } from "@/lib/stream/recommend";
import { tonightLineup } from "@/lib/stream/tonight";
import { clearProgress, continueWatching, useWatchState } from "@/lib/stream/watch-state";

export const Route = createFileRoute("/watch/browse/$row")({ component: BrowsePage });

const SORTS: { id: BrowseSort; label: string }[] = [
  { id: "default", label: "Featured" },
  { id: "title", label: "A–Z" },
  { id: "year", label: "Year" },
  { id: "runtime", label: "Runtime" },
];

function BrowsePage() {
  const { row } = Route.useParams();
  const state = useWatchState();
  const meta = rowMeta(row);
  const isContinue = row === "continue";
  const isTonight = row === "tonight";
  const decadeStart = parseDecade(row);
  const [sort, setSort] = useState<BrowseSort>("default");

  const rawTitles = isContinue
    ? continueWatching(state)
        .map((p) => getTitle(p.titleId))
        .filter((t): t is NonNullable<typeof t> => Boolean(t))
    : titlesForRow(row);

  const titles = useMemo(() => sortTitles(rawTitles, sort), [rawTitles, sort]);

  const label =
    meta?.label ??
    (decadeStart != null ? `The ${decadeOf(decadeStart)}` : row.replaceAll("-", " "));
  const subtitle =
    meta?.subtitle ??
    (titles.length
      ? `${titles.length} title${titles.length === 1 ? "" : "s"} in the vault`
      : "Nothing filed under this heading.");

  const slots = isTonight ? tonightLineup() : [];

  return (
    <WatchShell>
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Browse</p>
        <h1 className="mt-2 font-display text-4xl capitalize md:text-5xl">{label}</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">{subtitle}</p>

        {!isTonight && titles.length ? (
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Sort titles">
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSort(s.id)}
                className={`flex h-11 items-center rounded-full px-4 text-xs uppercase tracking-[0.12em] ${
                  sort === s.id ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-fg"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : null}

        {isTonight ? (
          <ol className="mt-8 divide-y divide-border overflow-hidden rounded-[var(--radius-xl)] bg-bg-elevated shadow-[var(--shadow-border)]">
            {slots.map((slot) => (
              <li key={`${slot.title.id}-${slot.startMin}`}>
                <Link
                  to="/watch/title/$titleId"
                  params={{ titleId: slot.title.id }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-surface"
                >
                  <span className="w-24 shrink-0 font-mono text-xs text-subtle">
                    {formatClockMin(slot.startMin)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{slot.title.title}</span>
                  <span className="hidden text-xs text-subtle sm:inline">{slot.title.year}</span>
                  <span className="text-xs text-subtle">{formatRuntime(slot.title.runtimeMin)}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}

        {isContinue && titles.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {titles.map((t) => (
              <TitleCard key={t.id} title={t} fill onDismiss={(id) => clearProgress(id)} />
            ))}
          </div>
        ) : null}

        {!isContinue && !isTonight && titles.length ? <CatalogGrid titles={titles} /> : null}

        {!titles.length && !isTonight ? (
          <div className="mt-12 max-w-md">
            <p className="text-sm text-muted">This row is empty. The vault is originals and public-domain prints only.</p>
            <Button className="mt-5" asChild>
              <Link to="/watch/catalog">Whole vault</Link>
            </Button>
          </div>
        ) : null}
      </main>
      <StreamFooter />
    </WatchShell>
  );
}

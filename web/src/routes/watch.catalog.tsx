import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CatalogGrid } from "@/components/stream/catalog-grid";
import { FilterChips } from "@/components/stream/filter-chips";
import { StreamFooter } from "@/components/stream/stream-footer";
import { WatchShell } from "@/components/stream/watch-shell";
import { filterCatalog, progressRatio } from "@/lib/stream/catalog-query";
import type { BrowseSort, CatalogOrigin, CatalogQuery, RuntimeBucket } from "@/lib/stream/types";
import { useWatchState } from "@/lib/stream/watch-state";

type CatalogSearch = CatalogQuery;

function parseSearch(s: Record<string, unknown>): CatalogSearch {
  const origin = s.origin === "original" || s.origin === "public_domain" ? (s.origin as CatalogOrigin) : undefined;
  const runtime =
    s.runtime === "short" || s.runtime === "feature" || s.runtime === "epic"
      ? (s.runtime as RuntimeBucket)
      : undefined;
  const sort =
    s.sort === "title" || s.sort === "year" || s.sort === "runtime" ? (s.sort as BrowseSort) : undefined;
  return {
    q: typeof s.q === "string" ? s.q : undefined,
    genre: typeof s.genre === "string" ? s.genre : undefined,
    decade: typeof s.decade === "string" ? s.decade : undefined,
    origin,
    runtime,
    sort,
  };
}

export const Route = createFileRoute("/watch/catalog")({
  validateSearch: parseSearch,
  component: CatalogPage,
});

const SORTS: { id: BrowseSort; label: string }[] = [
  { id: "default", label: "Featured" },
  { id: "title", label: "A–Z" },
  { id: "year", label: "Year" },
  { id: "runtime", label: "Runtime" },
];

function CatalogPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const state = useWatchState();
  const titles = useMemo(() => filterCatalog(search), [search]);

  const progress = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of Object.values(state.progress)) map[p.titleId] = progressRatio(p.seconds, p.duration);
    return map;
  }, [state.progress]);

  function patch(next: CatalogQuery) {
    void navigate({ search: next });
  }

  return (
    <WatchShell>
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Vault</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Every print on file.</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">
          Filter the house the way a Tubi grid works — originals and U.S. public-domain pictures only.
        </p>
        <FilterChips value={search} onChange={patch} />
        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Sort titles">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => patch({ ...search, sort: s.id === "default" ? undefined : s.id })}
              className={`flex h-11 items-center rounded-full px-4 text-xs uppercase tracking-[0.12em] ${
                (search.sort ?? "default") === s.id
                  ? "bg-primary text-primary-fg"
                  : "bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-subtle">{titles.length} titles</span>
        </div>
        <CatalogGrid titles={titles} progress={progress} />
      </main>
      <StreamFooter />
    </WatchShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo } from "react";
import { CatalogGrid } from "@/components/stream/catalog-grid";
import { FilterChips } from "@/components/stream/filter-chips";
import { StreamFooter } from "@/components/stream/stream-footer";
import { WatchShell } from "@/components/stream/watch-shell";
import { Input } from "@/components/ui/input";
import { titlesIn } from "@/lib/stream/catalog";
import { filterCatalog } from "@/lib/stream/catalog-query";
import type { CatalogOrigin, CatalogQuery, RuntimeBucket } from "@/lib/stream/types";

type SearchParams = CatalogQuery;

function parseSearch(s: Record<string, unknown>): SearchParams {
  const origin = s.origin === "original" || s.origin === "public_domain" ? (s.origin as CatalogOrigin) : undefined;
  const runtime =
    s.runtime === "short" || s.runtime === "feature" || s.runtime === "epic"
      ? (s.runtime as RuntimeBucket)
      : undefined;
  return {
    q: typeof s.q === "string" ? s.q : undefined,
    genre: typeof s.genre === "string" ? s.genre : undefined,
    decade: typeof s.decade === "string" ? s.decade : undefined,
    origin,
    runtime,
  };
}

export const Route = createFileRoute("/watch/search")({
  validateSearch: parseSearch,
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const q = search.q ?? "";
  const filtered = useMemo(() => filterCatalog(search), [search]);
  const hasFilter = Boolean(q.trim() || search.genre || search.decade || search.origin || search.runtime);
  const trending = titlesIn("trending");

  return (
    <WatchShell>
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Search</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Find a print.</h1>
        <div className="relative mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            autoFocus
            value={q}
            placeholder="Title, director, genre, cast, year"
            className="pl-10"
            onChange={(e) => void navigate({ search: { ...search, q: e.target.value || undefined } })}
          />
        </div>
        <FilterChips
          value={search}
          onChange={(next) => void navigate({ search: next })}
        />

        {hasFilter ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl">
              {filtered.length ? `${filtered.length} title${filtered.length === 1 ? "" : "s"}` : "No titles"}
            </h2>
            {filtered.length ? (
              <CatalogGrid titles={filtered} />
            ) : (
              <p className="mt-3 text-sm text-muted">
                Nothing in the vault matches. Try a director, a year, or a genre — originals and
                public-domain classics only.{" "}
                <Link to="/watch/surprise" className="text-fg underline-offset-2 hover:underline">
                  Surprise me instead
                </Link>
                .
              </p>
            )}
          </section>
        ) : (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl">Trending</h2>
              <Link
                to="/watch/catalog"
                className="text-xs uppercase tracking-[0.14em] text-muted hover:text-fg"
              >
                Whole vault
              </Link>
            </div>
            <CatalogGrid titles={trending} />
          </section>
        )}
      </main>
      <StreamFooter />
    </WatchShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { StreamFooter } from "@/components/stream/stream-footer";
import { WatchShell } from "@/components/stream/watch-shell";
import { allPeople } from "@/lib/stream/catalog-query";

export const Route = createFileRoute("/watch/people/")({ component: PeopleIndex });

function PeopleIndex() {
  const people = allPeople().filter((p) => p.titles.length >= 2);

  return (
    <WatchShell>
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">People</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Names in the vault.</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">
          Directors and players with more than one print on file. Public-domain casts, plus the floor company.
        </p>
        {people.length ? (
          <ul className="mt-8 divide-y divide-border overflow-hidden rounded-[var(--radius-xl)] bg-bg-elevated shadow-[var(--shadow-border)]">
            {people.map((p) => (
              <li key={p.slug}>
                <Link
                  to="/watch/people/$slug"
                  params={{ slug: p.slug }}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{p.name}</span>
                    <span className="text-xs text-subtle">
                      {p.directed ? `${p.directed} directed` : null}
                      {p.directed && p.appeared ? " · " : null}
                      {p.appeared ? `${p.appeared} on screen` : null}
                    </span>
                  </span>
                  <span className="text-xs text-subtle">{p.titles.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-sm text-muted">No repeating names yet.</p>
        )}
      </main>
      <StreamFooter />
    </WatchShell>
  );
}

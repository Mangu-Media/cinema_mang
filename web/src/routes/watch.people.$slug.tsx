import { createFileRoute, Link } from "@tanstack/react-router";
import { CatalogGrid } from "@/components/stream/catalog-grid";
import { StreamFooter } from "@/components/stream/stream-footer";
import { WatchShell } from "@/components/stream/watch-shell";
import { Button } from "@/components/ui/button";
import { getPerson } from "@/lib/stream/catalog-query";

export const Route = createFileRoute("/watch/people/$slug")({ component: PersonPage });

function PersonPage() {
  const { slug } = Route.useParams();
  const person = getPerson(slug);

  if (!person) {
    return (
      <WatchShell>
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-4xl">No such name.</h1>
          <p className="mt-3 text-sm text-muted">That credit is not in the vault.</p>
          <Button className="mt-6" asChild>
            <Link to="/watch/people">All people</Link>
          </Button>
        </main>
      </WatchShell>
    );
  }

  return (
    <WatchShell>
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">People</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">{person.name}</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">
          {person.titles.length} title{person.titles.length === 1 ? "" : "s"} on file
          {person.directed ? ` · ${person.directed} directed` : ""}
          {person.appeared ? ` · ${person.appeared} on screen` : ""}.
        </p>
        <CatalogGrid titles={person.titles} />
      </main>
      <StreamFooter />
    </WatchShell>
  );
}

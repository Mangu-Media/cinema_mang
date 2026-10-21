import { createFileRoute, Link } from "@tanstack/react-router";
import { StreamFooter } from "@/components/stream/stream-footer";
import { TitleCard } from "@/components/stream/title-card";
import { WatchShell } from "@/components/stream/watch-shell";
import { Button } from "@/components/ui/button";
import { comingSoonTitles } from "@/lib/stream/catalog";

export const Route = createFileRoute("/watch/coming-soon")({ component: ComingSoonPage });

function ComingSoonPage() {
  const titles = comingSoonTitles();
  return (
    <WatchShell>
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Coming soon</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Still on the floor.</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">
          CINEMA Originals that have not locked a Watch print. Open the studio if you want to run the pipeline.
        </p>
        {titles.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {titles.map((t) => (
              <TitleCard key={t.id} title={t} fill />
            ))}
          </div>
        ) : (
          <div className="mt-12">
            <p className="text-sm text-muted">Nothing pending. The originals that exist are already in the house.</p>
            <Button className="mt-5" asChild>
              <Link to="/watch">Watch home</Link>
            </Button>
          </div>
        )}
      </main>
      <StreamFooter />
    </WatchShell>
  );
}

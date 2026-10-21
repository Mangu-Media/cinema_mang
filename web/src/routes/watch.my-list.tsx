import { createFileRoute, Link } from "@tanstack/react-router";
import { StreamFooter } from "@/components/stream/stream-footer";
import { TitleCard } from "@/components/stream/title-card";
import { WatchShell } from "@/components/stream/watch-shell";
import { Button } from "@/components/ui/button";
import { getTitle } from "@/lib/stream/catalog";
import { useWatchState } from "@/lib/stream/watch-state";

export const Route = createFileRoute("/watch/my-list")({ component: MyListPage });

function MyListPage() {
  const state = useWatchState();
  const titles = state.list.map((id) => getTitle(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <WatchShell>
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">My list</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Saved for later.</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">
          Stored on this device only. No account, no profile wall. Add anything from a title page.
        </p>
        {titles.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {titles.map((t) => (
              <TitleCard key={t.id} title={t} fill />
            ))}
          </div>
        ) : (
          <div className="mt-12 max-w-md rounded-[var(--radius-xl)] bg-bg-elevated p-6 shadow-[var(--shadow-border)]">
            <p className="font-display text-2xl">The list is empty.</p>
            <p className="mt-2 text-sm text-muted">
              Browse originals or the vault and tap My list. It stays in this browser.
            </p>
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

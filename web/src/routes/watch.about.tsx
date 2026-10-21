import { createFileRoute, Link } from "@tanstack/react-router";
import { StreamFooter } from "@/components/stream/stream-footer";
import { WatchShell } from "@/components/stream/watch-shell";
import { STREAM_CATALOG } from "@/lib/stream/catalog";

export const Route = createFileRoute("/watch/about")({ component: AboutPage });

function AboutPage() {
  const originals = STREAM_CATALOG.filter((t) => t.origin === "original").length;
  const classics = STREAM_CATALOG.filter((t) => t.origin === "public_domain").length;
  return (
    <WatchShell>
      <main className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">About</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Two libraries. No studio catalog.</h1>
        <p className="mt-4 text-sm text-muted">
          CINEMA Watch is the house attached to the Script-to-Screen floor. Originals are produced here.
          Classics are pictures that have entered the U.S. public domain. Prints stream from the Internet
          Archive. My List, history, ratings, and resume live in this browser — there are no accounts.
        </p>
        <p className="mt-4 text-sm text-muted">
          {originals} originals · {classics} public-domain titles on file.
        </p>
        <p className="mt-4 text-sm text-muted">
          If a file does not answer, the player opens the Archive embed. VaultArt stands in when a still
          cannot be fetched. That is honest, not a bug dressed as design.
        </p>
        <p className="mt-8">
          <Link to="/watch" className="text-sm uppercase tracking-[0.14em] text-muted hover:text-fg">
            Back to Watch
          </Link>
        </p>
      </main>
      <StreamFooter />
    </WatchShell>
  );
}

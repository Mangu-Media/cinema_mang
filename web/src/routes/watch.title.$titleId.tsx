import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clapperboard, Copy, Play, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { PosterImg } from "@/components/stream/poster-img";
import { StreamFooter } from "@/components/stream/stream-footer";
import { TitleRow } from "@/components/stream/title-row";
import { WatchShell } from "@/components/stream/watch-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canPlay, getTitle, similarTo } from "@/lib/stream/catalog";
import { creditsOf, decadeOf, isWatched } from "@/lib/stream/catalog-query";
import { formatRuntime, remainingLabel } from "@/lib/stream/format";
import { clearProgress, markWatched, restartTitle, setRating, toggleList, useWatchState } from "@/lib/stream/watch-state";

export const Route = createFileRoute("/watch/title/$titleId")({ component: TitlePage });

function TitlePage() {
  const { titleId } = Route.useParams();
  const title = getTitle(titleId);
  const state = useWatchState();
  const [copied, setCopied] = useState(false);

  if (!title) {
    return (
      <WatchShell>
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-4xl">Title not in the vault.</h1>
          <p className="mt-3 text-sm text-muted">It may have been a working title. Return to Watch.</p>
          <Button className="mt-6" asChild>
            <Link to="/watch">Watch home</Link>
          </Button>
        </main>
      </WatchShell>
    );
  }

  const inList = state.list.includes(title.id);
  const saved = state.progress[title.id];
  const ratio = saved && saved.duration > 0 ? saved.seconds / saved.duration : 0;
  const resume = Boolean(saved && saved.duration > 0 && ratio < 0.92 && saved.seconds > 8);
  const similar = similarTo(title, 12);
  const playable = canPlay(title);
  const rating = state.ratings[title.id];
  const people = creditsOf(title);
  const decade = decadeOf(title.year);
  const watched = saved ? isWatched(saved.seconds, saved.duration) : false;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <WatchShell>
      <section className="relative min-h-[52dvh] overflow-hidden">
        <PosterImg
          src={title.backdrop}
          title={title.title}
          year={title.year}
          wide
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/25" />
      </section>
      <main className="relative z-10 mx-auto -mt-40 max-w-[1400px] px-4 pb-8 md:-mt-48 md:px-8">
        <div className="grid gap-8 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="mx-auto w-[160px] overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-border)] md:mx-0 md:w-full">
            <div className="aspect-[2/3] bg-surface-2">
              <PosterImg src={title.poster} title={title.title} year={title.year} />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="solid">{title.origin === "original" ? "CINEMA Original" : "Public domain"}</Badge>
              <Badge>{title.kind}</Badge>
              <Badge>{title.rating}</Badge>
              <Badge>{title.year}</Badge>
              <Badge>{formatRuntime(title.runtimeMin)}</Badge>
            </div>
            <h1 className="mt-4 font-display text-5xl font-medium tracking-tight md:text-6xl">{title.title}</h1>
            <p className="mt-3 max-w-2xl text-base text-muted">{title.tagline}</p>
            <p className="mt-3 max-w-2xl text-sm text-subtle">{title.synopsis}</p>
            {resume ? (
              <div className="mt-4 max-w-md">
                <div className="h-1 overflow-hidden rounded-full bg-fg/15">
                  <div className="h-full bg-primary" style={{ width: `${Math.round(ratio * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-subtle">{remainingLabel(ratio, title.runtimeMin)}</p>
              </div>
            ) : null}
            <dl className="mt-5 grid max-w-2xl gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-subtle">Director</dt>
                <dd className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                  {people
                    .filter((p) => p.role === "director")
                    .map((p) => (
                      <Link
                        key={p.slug}
                        to="/watch/people/$slug"
                        params={{ slug: p.slug }}
                        className="hover:text-primary"
                      >
                        {p.name}
                      </Link>
                    ))}
                </dd>
              </div>
              {title.cast.length ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-subtle">Cast</dt>
                  <dd className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                    {people
                      .filter((p) => p.role === "cast")
                      .map((p) => (
                        <Link
                          key={p.slug}
                          to="/watch/people/$slug"
                          params={{ slug: p.slug }}
                          className="hover:text-primary"
                        >
                          {p.name}
                        </Link>
                      ))}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-subtle">Decade</dt>
                <dd className="mt-1">
                  <Link to="/watch/browse/$row" params={{ row: decade }} className="hover:text-primary">
                    {decade}
                  </Link>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-[0.14em] text-subtle">Genres</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {title.genres.map((g) => (
                    <Link
                      key={g}
                      to="/watch/browse/$row"
                      params={{ row: g }}
                      className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted hover:text-fg"
                    >
                      {g}
                    </Link>
                  ))}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              {playable ? (
                <Button asChild>
                  <Link to="/watch/play/$titleId" params={{ titleId: title.id }}>
                    <Play className="fill-current" /> {resume ? "Resume" : watched ? "Play again" : "Play"}
                  </Link>
                </Button>
              ) : (
                <Button disabled>Coming soon</Button>
              )}
              {resume ? (
                <Button
                  variant="secondary"
                  asChild
                  onClick={() => restartTitle(title.id)}
                >
                  <Link to="/watch/play/$titleId" params={{ titleId: title.id }}>
                    Play from start
                  </Link>
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => toggleList(title.id)}>
                {inList ? <Check /> : <Plus />} {inList ? "In my list" : "My list"}
              </Button>
              <Button
                variant={rating === "up" ? "secondary" : "ghost"}
                aria-pressed={rating === "up"}
                aria-label="Rate up"
                onClick={() => setRating(title.id, "up")}
              >
                <ThumbsUp className="size-4" />
              </Button>
              <Button
                variant={rating === "down" ? "secondary" : "ghost"}
                aria-pressed={rating === "down"}
                aria-label="Rate down"
                onClick={() => setRating(title.id, "down")}
              >
                <ThumbsDown className="size-4" />
              </Button>
              <Button variant="ghost" onClick={() => void copyLink()}>
                <Copy className="size-4" /> {copied ? "Copied" : "Copy link"}
              </Button>
              {resume ? (
                <Button variant="ghost" onClick={() => clearProgress(title.id)}>
                  Remove from continue
                </Button>
              ) : null}
              {playable && !watched ? (
                <Button
                  variant="ghost"
                  onClick={() => markWatched(title.id, Math.max(60, title.runtimeMin * 60))}
                >
                  Mark watched
                </Button>
              ) : null}
              {title.animaticJobId ? (
                <Button variant="secondary" asChild>
                  <Link to="/jobs/$jobId" params={{ jobId: title.animaticJobId }}>
                    <Clapperboard /> Open on the floor
                  </Link>
                </Button>
              ) : null}
            </div>
            {title.origin === "public_domain" ? (
              <p className="mt-6 max-w-2xl text-xs text-subtle">
                This picture is in the U.S. public domain. The print streams from the Internet Archive.
                Poster art, if present, is a catalog still — not a licensed key art package.
              </p>
            ) : (
              <p className="mt-6 max-w-2xl text-xs text-subtle">
                CINEMA Original. Produced on the Script-to-Screen floor. The Watch print is the locked
                animatic or unit teaser — not a licensed studio feature.
              </p>
            )}
          </div>
        </div>
      </main>
      <TitleRow label="More like this" titles={similar} />
      <StreamFooter />
    </WatchShell>
  );
}

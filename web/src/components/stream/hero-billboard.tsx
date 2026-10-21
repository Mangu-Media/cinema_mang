import { Link } from "@tanstack/react-router";
import { Check, Info, Play, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRuntime } from "@/lib/stream/format";
import type { StreamTitle } from "@/lib/stream/types";
import { loadWatchState, toggleList } from "@/lib/stream/watch-state";
import { canPlay } from "@/lib/stream/catalog";
import { PosterImg } from "./poster-img";

export function HeroBillboard({ title }: { title: StreamTitle }) {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    setInList(loadWatchState().list.includes(title.id));
  }, [title.id]);

  return (
    <section className="relative min-h-[78dvh] overflow-hidden">
      {title.trailer ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={title.trailer}
          autoPlay
          muted
          loop
          playsInline
          poster={title.backdrop}
        />
      ) : (
        <PosterImg
          src={title.backdrop}
          title={title.title}
          year={title.year}
          wide
          className="absolute inset-0 h-full w-full"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-bg/20 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-[78dvh] max-w-[1400px] flex-col justify-end px-4 pb-16 pt-24 md:px-8 md:pb-24">
        <div className="flex flex-wrap gap-2">
          <Badge tone="solid">{title.origin === "original" ? "CINEMA Original" : "Public domain"}</Badge>
          <Badge>{title.year}</Badge>
          <Badge>{title.rating}</Badge>
          <Badge>{formatRuntime(title.runtimeMin)}</Badge>
        </div>
        <h1 className="mt-4 max-w-xl font-display text-5xl font-medium tracking-tight md:text-7xl">
          {title.title}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-muted md:text-base">{title.tagline}</p>
        <p className="mt-2 max-w-lg text-sm text-subtle line-clamp-3">{title.synopsis}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {canPlay(title) ? (
            <Button asChild>
              <Link to="/watch/play/$titleId" params={{ titleId: title.id }}>
                <Play className="fill-current" /> Play
              </Link>
            </Button>
          ) : (
            <Button disabled>Coming soon</Button>
          )}
          <Button variant="secondary" asChild>
            <Link to="/watch/title/$titleId" params={{ titleId: title.id }}>
              <Info /> More info
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setInList(toggleList(title.id).list.includes(title.id))}
          >
            {inList ? <Check /> : <Plus />} {inList ? "In my list" : "My list"}
          </Button>
        </div>
      </div>
    </section>
  );
}

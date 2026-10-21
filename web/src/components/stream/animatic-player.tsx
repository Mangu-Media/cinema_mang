import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StoryboardFrame } from "@/components/workspace/storyboard-frame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { asNumber, formatTimecode } from "@/lib/cse/format";
import { getJobBundle } from "@/lib/server/jobs";
import { formatClock } from "@/lib/stream/format";
import type { StreamTitle } from "@/lib/stream/types";
import { loadWatchState, setProgress } from "@/lib/stream/watch-state";
import { StreamPlayer } from "./player";

type Beat = {
  index: number;
  start: number;
  end: number;
  duration: number;
  code: string;
  shotType: string;
  description: string;
  dialogue: string;
  url: string | null;
};

export function AnimaticPlayer({ title }: { title: StreamTitle }) {
  const jobId = title.animaticJobId;
  const job = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobBundle({ data: { jobId: jobId! } }),
    enabled: Boolean(jobId),
  });

  if (!jobId) {
    if (title.playback || title.trailer) {
      return <StreamPlayer title={{ ...title, player: "video", playback: title.playback ?? title.trailer }} />;
    }
    return <Missing title={title} />;
  }

  if (job.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <p className="text-sm text-muted">Loading locked animatic…</p>
      </div>
    );
  }

  const shots = job.data?.shots ?? [];
  if (!shots.length) {
    if (title.trailer) {
      return <StreamPlayer title={{ ...title, player: "video", playback: title.trailer }} />;
    }
    return <Missing title={title} />;
  }

  return <AnimaticTheater title={title} shots={shots} />;
}

function Missing({ title }: { title: StreamTitle }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="font-display text-3xl">Animatic not locked.</p>
      <p className="mt-2 text-sm text-muted">Open the floor and run the pipeline for this original.</p>
      <Button className="mt-5" asChild>
        <Link to="/watch/title/$titleId" params={{ titleId: title.id }}>
          Back to title
        </Link>
      </Button>
    </div>
  );
}

function AnimaticTheater({
  title,
  shots,
}: {
  title: StreamTitle;
  shots: {
    shot_code: string;
    shot_type: string;
    duration_s: number | string;
    description: string;
    dialogue: string;
    storyboard_url: string | null;
  }[];
}) {
  const navigate = useNavigate();
  const beats = useMemo<Beat[]>(() => {
    let cursor = 0;
    return shots.map((s, index) => {
      const duration = Math.max(2.4, asNumber(s.duration_s) || 4);
      const start = cursor;
      const end = cursor + duration;
      cursor = end;
      return {
        index,
        start,
        end,
        duration,
        code: s.shot_code,
        shotType: s.shot_type,
        description: s.description,
        dialogue: s.dialogue,
        url: s.storyboard_url,
      };
    });
  }, [shots]);

  const total = beats[beats.length - 1]?.end ?? 0;
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [idle, setIdle] = useState(false);
  const [ended, setEnded] = useState(false);
  const hideRef = useRef(0);
  const lastRef = useRef(performance.now());
  const timeRef = useRef(0);

  const bump = useCallback(() => {
    setIdle(false);
    window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(() => {
      if (playing && !ended) setIdle(true);
    }, 2800);
  }, [playing, ended]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const saved = loadWatchState().progress[title.id];
    if (saved && saved.seconds > 2 && saved.seconds < total * 0.92) {
      timeRef.current = saved.seconds;
      setTime(saved.seconds);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [title.id, total]);

  useEffect(() => {
    lastRef.current = performance.now();
    if (!playing || ended) return;
    let raf = 0;
    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      timeRef.current = Math.min(total, timeRef.current + dt);
      setTime(timeRef.current);
      if (timeRef.current >= total) {
        setEnded(true);
        setPlaying(false);
        setProgress(title.id, total, total);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, ended, total, title.id]);

  useEffect(() => {
    if (Math.floor(time) % 3 === 0 && total > 0) setProgress(title.id, time, total);
  }, [time, total, title.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        setPlaying((p) => !p);
        setEnded(false);
      } else if (e.key === "ArrowRight") skip(1);
      else if (e.key === "ArrowLeft") skip(-1);
      else if (e.key === "Escape") {
        void navigate({ to: "/watch/title/$titleId", params: { titleId: title.id } });
      }
      bump();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const beat = beats.find((b) => time < b.end) ?? beats[beats.length - 1];

  function seek(next: number) {
    const clamped = Math.max(0, Math.min(total, next));
    timeRef.current = clamped;
    setTime(clamped);
    setEnded(clamped >= total);
    if (clamped < total) setPlaying(true);
  }

  function skip(dir: number) {
    if (!beat) return;
    const nextIndex = Math.max(0, Math.min(beats.length - 1, beat.index + dir));
    seek(beats[nextIndex].start);
  }

  if (!beat) return <Missing title={title} />;

  return (
    <div className="relative min-h-dvh bg-bg" onMouseMove={bump} onClick={() => {
      setPlaying((p) => !p);
      setEnded(false);
      bump();
    }}>
      <div className="absolute inset-0 flex items-center justify-center px-0 md:px-16 md:py-16">
        <div key={beat.code} className="kenburns w-full max-w-[1400px] overflow-hidden">
          <StoryboardFrame
            shotType={beat.shotType}
            code={beat.code}
            promptUrl={beat.url}
            className="rounded-none md:rounded-[var(--radius-md)]"
          />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/50" />

      {beat.dialogue ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-10 px-6 text-center md:bottom-32">
          <p className="mx-auto max-w-2xl text-sm text-fg md:text-base">{beat.dialogue}</p>
        </div>
      ) : beat.description ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-10 px-6 text-center md:bottom-32">
          <p className="mx-auto max-w-2xl text-sm text-muted">{beat.description}</p>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 py-3 md:px-6",
          idle && playing ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="flex size-11 items-center justify-center"
          aria-label="Back"
          onClick={() => void navigate({ to: "/watch/title/$titleId", params: { titleId: title.id } })}
        >
          <ChevronLeft className="size-6" />
        </button>
        <div>
          <div className="text-sm">{title.title}</div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-subtle">
            Director’s animatic · {beat.code} · {beat.shotType.replaceAll("_", " ")}
          </div>
        </div>
      </div>

      {ended ? (
        <div
          className="absolute inset-0 z-30 flex flex-col items-start justify-end bg-bg/80 px-6 pb-16"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Locked animatic</p>
          <h2 className="mt-1 font-display text-4xl">{title.title}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                seek(0);
                setPlaying(true);
                setEnded(false);
              }}
            >
              <Play className="fill-current" /> Play again
            </Button>
            {title.animaticJobId ? (
              <Button variant="secondary" asChild>
                <Link to="/jobs/$jobId" params={{ jobId: title.animaticJobId }}>
                  Open on the floor
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link to="/watch">Back to Watch</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 px-4 pb-5 pt-8 md:px-8",
          idle && playing && !ended ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          min={0}
          max={total || 0}
          step={0.1}
          value={time}
          aria-label="Seek"
          className="player-seek mb-3 w-full"
          onChange={(e) => seek(Number(e.target.value))}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex size-11 items-center justify-center"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => {
              setEnded(false);
              setPlaying((p) => !p);
            }}
          >
            {playing && !ended ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
          </button>
          <button
            type="button"
            className="flex size-11 items-center justify-center"
            aria-label="Previous shot"
            onClick={() => skip(-1)}
          >
            <SkipBack className="size-5" />
          </button>
          <button
            type="button"
            className="flex size-11 items-center justify-center"
            aria-label="Next shot"
            onClick={() => skip(1)}
          >
            <SkipForward className="size-5" />
          </button>
          <span className="ml-2 font-mono text-xs text-muted tabular">
            {formatClock(time)} / {formatTimecode(total)}
          </span>
          <span className="ml-auto hidden text-[11px] uppercase tracking-[0.14em] text-subtle sm:inline">
            Shot {beat.index + 1} of {beats.length}
          </span>
        </div>
      </div>
    </div>
  );
}

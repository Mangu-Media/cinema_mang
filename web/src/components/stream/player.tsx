import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { similarTo } from "@/lib/stream/catalog";
import { skipOpeningSeconds } from "@/lib/stream/catalog-query";
import { formatClock, formatPlayerClock } from "@/lib/stream/format";
import { nextUp } from "@/lib/stream/recommend";
import { PLAYBACK_RATES, type StreamTitle } from "@/lib/stream/types";
import { loadWatchState, setPlaybackRate, setProgress, setVolumePrefs } from "@/lib/stream/watch-state";
import { TitleCard } from "./title-card";

export function StreamPlayer({ title }: { title: StreamTitle }) {
  const src = title.playback;
  const embed = title.embedUrl;
  const [mode, setMode] = useState<"video" | "embed">(src ? "video" : "embed");

  if (mode === "video" && src) {
    return <VideoTheater title={title} src={src} onFail={embed ? () => setMode("embed") : undefined} />;
  }
  if (embed) return <EmbedTheater title={title} embedUrl={embed} />;
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-sm text-muted">No print on file for this title.</p>
      <Button className="mt-4" asChild>
        <Link to="/watch/title/$titleId" params={{ titleId: title.id }}>
          Back to title
        </Link>
      </Button>
    </div>
  );
}

function EmbedTheater({ title, embedUrl }: { title: StreamTitle; embedUrl: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    const existing = loadWatchState().progress[title.id];
    if (!existing) setProgress(title.id, 12, Math.max(60, title.runtimeMin * 60));
  }, [title.id, title.runtimeMin]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-bg">
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-3 bg-gradient-to-b from-bg to-transparent px-3 py-3 md:px-6">
        <button
          type="button"
          className="flex size-11 items-center justify-center text-fg"
          aria-label="Back"
          onClick={() => void navigate({ to: "/watch/title/$titleId", params: { titleId: title.id } })}
        >
          <ChevronLeft className="size-6" />
        </button>
        <div>
          <div className="text-sm">{title.title}</div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-subtle">Internet Archive print</div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-0 md:p-10 md:pt-20">
        <div className="aspect-video w-full max-w-[1400px] overflow-hidden bg-surface md:rounded-[var(--radius-md)]">
          <iframe
            title={title.title}
            src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
            className="h-full w-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

function VideoTheater({
  title,
  src,
  onFail,
}: {
  title: StreamTitle;
  src: string;
  onFail?: () => void;
}) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hideRef = useRef<number>(0);
  const playClickRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(() => loadWatchState().muted);
  const [volume, setVolume] = useState(() => loadWatchState().volume);
  const [idle, setIdle] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fs, setFs] = useState(false);
  const [ready, setReady] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [remain, setRemain] = useState(false);
  const [rate, setRate] = useState(() => loadWatchState().playbackRate);
  const [help, setHelp] = useState(false);
  const [nextIn, setNextIn] = useState<number | null>(null);
  const similar = similarTo(title, 6);
  const upcoming = nextUp(title);
  const skipTo = skipOpeningSeconds(title);
  const showSkip = Boolean(skipTo && duration > 120 && current > 1.5 && current < skipTo);

  const bump = useCallback(() => {
    setIdle(false);
    window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setIdle(true);
    }, 2800);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
    v.playbackRate = rate;
    if (v.readyState >= 1 && v.duration) {
      setDuration(v.duration);
      setReady(true);
    }
  }, [volume, muted, rate]);

  useEffect(() => {
    if (ready) return;
    const t = window.setTimeout(() => {
      if (onFail) onFail();
      else setFailed(true);
    }, 8000);
    return () => window.clearTimeout(t);
  }, [ready, onFail]);

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const v = videoRef.current;
      if (!v) return;
      if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        if (v.paused) void v.play();
        else v.pause();
      } else if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
        v.currentTime = Math.max(0, v.currentTime - 10);
      } else if (e.key === "ArrowRight" || e.key === "l" || e.key === "L") {
        v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const nextVol = Math.min(1, v.volume + 0.1);
        v.volume = nextVol;
        setVolume(nextVol);
        setMuted(false);
        setVolumePrefs(nextVol, false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextVol = Math.max(0, v.volume - 0.1);
        v.volume = nextVol;
        setVolume(nextVol);
        setMuted(nextVol === 0);
        setVolumePrefs(nextVol, nextVol === 0);
      } else if (e.key === "m" || e.key === "M") {
        v.muted = !v.muted;
        setMuted(v.muted);
        setVolumePrefs(v.volume, v.muted);
      } else if (e.key === "f" || e.key === "F") {
        toggleFs();
      } else if (e.key === "p" || e.key === "P") {
        void togglePip();
      } else if (e.key === ">" || e.key === ".") {
        nudgeRate(1);
      } else if (e.key === "<" || e.key === ",") {
        nudgeRate(-1);
      } else if ((e.key === "n" || e.key === "N") && upcoming) {
        void navigate({ to: "/watch/play/$titleId", params: { titleId: upcoming.id } });
      } else if (e.key === "?") {
        e.preventDefault();
        setHelp((h) => !h);
      } else if (e.key === "t" || e.key === "T") {
        setRemain((r) => !r);
      } else if ((e.key === "i" || e.key === "I") && skipTo) {
        v.currentTime = skipTo;
      } else if (e.key === "Escape" && !document.fullscreenElement) {
        if (help) setHelp(false);
        else void navigate({ to: "/watch/title/$titleId", params: { titleId: title.id } });
      }
      bump();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bump, navigate, title.id, upcoming, help, rate, skipTo]);

  useEffect(() => {
    if (!ended || !upcoming) {
      setNextIn(null);
      return;
    }
    setNextIn(8);
    const t = window.setInterval(() => {
      setNextIn((n) => {
        if (n == null) {
          window.clearInterval(t);
          return null;
        }
        if (n <= 1) {
          window.clearInterval(t);
          void navigate({ to: "/watch/play/$titleId", params: { titleId: upcoming.id } });
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [ended, upcoming, navigate]);

  function persist() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress(title.id, v.currentTime, v.duration);
  }

  function toggleFs() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }

  function cycleRate() {
    const idx = PLAYBACK_RATES.indexOf(rate as (typeof PLAYBACK_RATES)[number]);
    const nextRate = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length] ?? 1;
    setRate(nextRate);
    setPlaybackRate(nextRate);
    const v = videoRef.current;
    if (v) v.playbackRate = nextRate;
  }

  function nudgeRate(dir: 1 | -1) {
    const idx = Math.max(0, PLAYBACK_RATES.indexOf(rate as (typeof PLAYBACK_RATES)[number]));
    const nextRate = PLAYBACK_RATES[Math.min(PLAYBACK_RATES.length - 1, Math.max(0, idx + dir))] ?? 1;
    setRate(nextRate);
    setPlaybackRate(nextRate);
    const v = videoRef.current;
    if (v) v.playbackRate = nextRate;
  }

  async function togglePip() {
    const v = videoRef.current;
    if (!v || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      /* unsupported */
    }
  }

  function seekTo(next: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = next;
    setCurrent(next);
  }

  if (failed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
        <p className="font-display text-3xl">Print failed to load.</p>
        <p className="mt-2 max-w-md text-sm text-muted">
          The Internet Archive source did not answer. Try the archive player, or pick another title.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onFail ? (
            <Button onClick={onFail}>Open archive player</Button>
          ) : null}
          <Button variant="secondary" asChild>
            <Link to="/watch/title/$titleId" params={{ titleId: title.id }}>
              Back to title
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="relative min-h-dvh bg-bg"
      onMouseMove={bump}
      onDoubleClick={(e) => {
        e.preventDefault();
        window.clearTimeout(playClickRef.current);
        toggleFs();
      }}
      onClick={() => {
        const v = videoRef.current;
        if (!v || ended) return;
        window.clearTimeout(playClickRef.current);
        playClickRef.current = window.setTimeout(() => {
          if (v.paused) void v.play();
          else v.pause();
          bump();
        }, 220);
      }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full bg-bg object-contain"
        src={src}
        poster={title.backdrop}
        playsInline
        autoPlay
        onPlay={() => {
          setPlaying(true);
          setEnded(false);
          bump();
        }}
        onPause={() => {
          setPlaying(false);
          persist();
          setIdle(false);
        }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          setCurrent(v.currentTime);
          if (Math.floor(v.currentTime) % 5 === 0) persist();
        }}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (!v) return;
          setDuration(v.duration);
          setReady(true);
          const saved = loadWatchState().progress[title.id];
          if (saved && saved.seconds > 8 && saved.seconds / (saved.duration || v.duration) < 0.92) {
            v.currentTime = saved.seconds;
            setCurrent(saved.seconds);
          }
          v.playbackRate = rate;
          void v.play().catch(() => setPlaying(false));
        }}
        onEnded={() => {
          setEnded(true);
          setPlaying(false);
          persist();
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onError={() => {
          if (onFail) onFail();
          else setFailed(true);
        }}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/40 transition-opacity duration-300",
          idle && playing && !ended ? "opacity-0" : "opacity-100",
        )}
      />

      <div
        className={cn(
          "absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 py-3 transition-opacity duration-200 md:px-6",
          idle && playing && !ended ? "pointer-events-none opacity-0" : "opacity-100",
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
        <div className="min-w-0">
          <div className="truncate text-sm">{title.title}</div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-subtle">
            {title.year} · {title.origin === "original" ? "CINEMA Original" : "Public domain"}
          </div>
        </div>
      </div>

      {!playing && !ended ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-fg">
            <Play className="size-7 fill-current" />
          </span>
        </div>
      ) : null}

      {!ready || waiting ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="size-10 animate-pulse rounded-full border border-primary/40" />
          <span className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            {waiting ? "Buffering" : "Loading print"}
          </span>
        </div>
      ) : null}

      {ended ? (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-end bg-bg/80 px-4 pb-10 pt-24 md:px-10"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">You just watched</p>
          <h2 className="mt-1 font-display text-4xl">{title.title}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                v.currentTime = 0;
                setEnded(false);
                setNextIn(null);
                void v.play();
              }}
            >
              <Play className="fill-current" /> Play again
            </Button>
            {upcoming ? (
              <Button
                variant="secondary"
                onClick={() => void navigate({ to: "/watch/play/$titleId", params: { titleId: upcoming.id } })}
              >
                Next: {upcoming.title}
                {nextIn ? ` · ${nextIn}` : ""}
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link to="/watch">Back to Watch</Link>
            </Button>
            {upcoming ? (
              <Button variant="ghost" onClick={() => setNextIn(null)}>
                Cancel autoplay
              </Button>
            ) : null}
          </div>
          <div className="mt-8">
            <h3 className="mb-3 font-display text-2xl">More like this</h3>
            <div className="row-scroll flex gap-3 overflow-x-auto pb-2">
              {similar.map((t) => (
                <TitleCard key={t.id} title={t} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 px-4 pb-5 pt-10 transition-opacity duration-200 md:px-8",
          idle && playing && !ended ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          aria-label="Seek"
          className="player-seek mb-3 w-full"
          onChange={(e) => seekTo(Number(e.target.value))}
        />
        {showSkip && skipTo ? (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              className="flex h-11 items-center rounded-full bg-primary px-4 text-xs uppercase tracking-[0.14em] text-primary-fg"
              onClick={() => seekTo(skipTo)}
            >
              Skip opening
            </button>
          </div>
        ) : null}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            className="flex size-11 items-center justify-center"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              if (v.paused) void v.play();
              else v.pause();
            }}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
          </button>
          <button
            type="button"
            className="flex size-11 items-center justify-center"
            aria-label="Back 10 seconds"
            onClick={() => seekTo(Math.max(0, current - 10))}
          >
            <SkipBack className="size-5" />
          </button>
          <button
            type="button"
            className="flex size-11 items-center justify-center"
            aria-label="Forward 10 seconds"
            onClick={() => seekTo(Math.min(duration, current + 10))}
          >
            <SkipForward className="size-5" />
          </button>
          <button
            type="button"
            className="flex size-11 items-center justify-center"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = !v.muted;
              setMuted(v.muted);
              setVolumePrefs(v.volume, v.muted);
            }}
          >
            {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            aria-label="Volume"
            className="player-seek hidden w-24 md:block"
            onChange={(e) => {
              const next = Number(e.target.value);
              setVolume(next);
              setMuted(next === 0);
              const v = videoRef.current;
              if (v) {
                v.volume = next;
                v.muted = next === 0;
              }
              setVolumePrefs(next, next === 0);
            }}
          />
          <button
            type="button"
            className="ml-2 font-mono text-xs text-muted tabular"
            aria-label="Toggle remaining time"
            onClick={() => setRemain((r) => !r)}
          >
            {formatPlayerClock(current, duration, remain)} / {formatClock(duration)}
          </button>
          <button
            type="button"
            className="ml-2 hidden h-11 items-center px-2 font-mono text-xs text-muted sm:flex"
            aria-label="Playback speed"
            onClick={cycleRate}
          >
            {rate}x
          </button>
          <span className="ml-auto hidden items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-subtle lg:flex">
            {title.origin === "original" ? (
              <>
                <Check className="size-3" /> Original
              </>
            ) : (
              "Free · Public domain"
            )}
          </span>
          <button
            type="button"
            className="flex size-11 items-center justify-center"
            aria-label="Picture in picture"
            onClick={() => void togglePip()}
          >
            <PictureInPicture2 className="size-5" />
          </button>
          <button
            type="button"
            className="flex size-11 items-center justify-center"
            aria-label={fs ? "Exit fullscreen" : "Fullscreen"}
            onClick={toggleFs}
          >
            {fs ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </button>
        </div>
      </div>

      {help ? (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-bg/80 p-6"
          onClick={(e) => {
            e.stopPropagation();
            setHelp(false);
          }}
        >
          <div className="max-w-sm rounded-[var(--radius-xl)] bg-bg-elevated p-6 shadow-[var(--shadow-border)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Shortcuts</p>
            <p className="mt-2 text-sm text-muted">
              Space play · J/L skip · M mute · F full · P pip · T remaining · I skip opening · N next · ? close
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

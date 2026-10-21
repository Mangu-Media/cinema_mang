import { Link } from "@tanstack/react-router";
import { formatClockMin, formatRuntime } from "@/lib/stream/format";
import { onNow, upcomingSlots } from "@/lib/stream/tonight";
import { PosterImg } from "./poster-img";

export function TonightRail() {
  const now = onNow();
  const upcoming = upcomingSlots(new Date(), 8);

  if (!now) return null;

  return (
    <section className="mb-10 px-4 md:px-8">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-tight">On now</h2>
          <p className="text-xs text-subtle">A 24-hour vault lineup. No ads. No licensed remainder.</p>
        </div>
        <Link
          to="/watch/browse/$row"
          params={{ row: "tonight" }}
          className="text-xs uppercase tracking-[0.14em] text-muted hover:text-fg"
        >
          Full slate
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Link
          to="/watch/title/$titleId"
          params={{ titleId: now.title.id }}
          className="group relative overflow-hidden rounded-[var(--radius-xl)] bg-surface shadow-[var(--shadow-border)]"
        >
          <div className="relative aspect-video">
            <PosterImg
              src={now.title.backdrop}
              title={now.title.title}
              year={now.title.year}
              wide
              className="transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-record px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] text-fg">
              Live
            </span>
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-subtle">
                {formatClockMin(now.startMin)} – {formatClockMin(now.endMin)}
              </div>
              <div className="mt-1 font-display text-3xl tracking-tight">{now.title.title}</div>
              <div className="mt-1 text-sm text-muted">{now.title.tagline}</div>
            </div>
          </div>
        </Link>
        <ol className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] bg-bg-elevated shadow-[var(--shadow-border)]">
          {upcoming.map((slot, i) => (
            <li key={`${slot.title.id}-${slot.startMin}`} className="border-b border-border last:border-b-0">
              <Link
                to="/watch/title/$titleId"
                params={{ titleId: slot.title.id }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface"
              >
                <span className="w-16 shrink-0 font-mono text-[11px] text-subtle">
                  {i === 0 ? "Now" : formatClockMin(slot.startMin)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{slot.title.title}</span>
                <span className="shrink-0 text-[11px] text-subtle">{formatRuntime(slot.title.runtimeMin)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

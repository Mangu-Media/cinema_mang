import { createFileRoute } from "@tanstack/react-router";
import { StreamFooter } from "@/components/stream/stream-footer";
import { WatchShell } from "@/components/stream/watch-shell";

export const Route = createFileRoute("/watch/help")({ component: HelpPage });

const KEYS = [
  ["/", "Search"],
  ["?", "This page"],
  ["Space / K", "Play or pause"],
  ["J / ←", "Back 10 seconds"],
  ["L / →", "Forward 10 seconds"],
  ["↑ / ↓", "Volume"],
  ["M", "Mute"],
  ["F", "Fullscreen"],
  ["Double-click", "Fullscreen"],
  ["P", "Picture in picture"],
  ["< / >", "Playback speed"],
  ["T", "Elapsed or remaining"],
  ["I", "Skip opening titles"],
  ["N", "Play a similar title"],
  ["← / → on a row", "Move across titles"],
  ["Esc", "Leave the player"],
];

function HelpPage() {
  return (
    <WatchShell>
      <main className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Help</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Keyboard.</h1>
        <p className="mt-3 text-sm text-muted">
          The house is built for a laptop in a dark room. Press ? from any Watch page.
        </p>
        <dl className="mt-8 divide-y divide-border overflow-hidden rounded-[var(--radius-xl)] bg-bg-elevated shadow-[var(--shadow-border)]">
          {KEYS.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="font-mono text-xs text-subtle">{k}</dt>
              <dd className="text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </main>
      <StreamFooter />
    </WatchShell>
  );
}

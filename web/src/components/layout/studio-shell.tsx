import { Link, useRouterState } from "@tanstack/react-router";
import { Clapperboard, Film, Library, MonitorPlay, Plus, Rows3 } from "lucide-react";
import type { ReactNode } from "react";
import { FilmMark } from "@/components/brand/film-mark";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/", label: "Studio", icon: Film },
  { to: "/watch", label: "Watch", icon: MonitorPlay },
  { to: "/ingest", label: "Ingest", icon: Plus },
  { to: "/pipeline", label: "Pipeline", icon: Rows3 },
  { to: "/bible", label: "Bible", icon: Library },
] as const;

export function StudioShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <a
        href="#studio-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        Skip to floor
      </a>
      <aside className="sticky top-0 hidden h-dvh w-[220px] shrink-0 flex-col border-r border-border bg-bg-elevated md:flex">
        <Link to="/" className="flex items-center gap-2.5 px-5 py-6">
          <FilmMark className="size-6" />
          <div className="leading-none">
            <div className="font-display text-xl font-medium tracking-tight">CINEMA</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-subtle">Script to screen</div>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm transition-colors duration-150",
                  active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-5 text-[10px] uppercase leading-relaxed tracking-[0.14em] text-subtle">
          CSE orchestrator
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur-sm md:h-16 md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <FilmMark className="size-5" />
            <span className="font-display text-lg">CINEMA</span>
          </div>
          <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-subtle md:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-record" />
              Live floor
            </span>
            <span className="text-border-strong">/</span>
            <span>CSE orchestrator</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/watch"
              className="hidden h-11 items-center gap-2 px-3 text-xs uppercase tracking-[0.14em] text-muted hover:text-fg md:flex"
            >
              <MonitorPlay className="size-3.5" />
              Watch
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted">
              <Clapperboard className="size-3.5" />
              <span className="hidden sm:inline">Idempotent jobs · append-only audit</span>
            </div>
          </div>
        </header>
        <div id="studio-main" className="flex-1 pb-20 md:pb-0">
          {children}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-bg-elevated md:hidden">
        {NAV.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.12em]",
                active ? "text-fg" : "text-subtle",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

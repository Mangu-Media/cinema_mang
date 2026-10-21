import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Clapperboard, Dices, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { FilmMark } from "@/components/brand/film-mark";
import { cn } from "@/lib/cn";

type NavItem =
  | { kind: "home"; label: string }
  | { kind: "browse"; label: string; row: string }
  | { kind: "list"; label: string }
  | { kind: "catalog"; label: string };

const NAV: NavItem[] = [
  { kind: "home", label: "Home" },
  { kind: "browse", label: "Originals", row: "originals" },
  { kind: "catalog", label: "Vault" },
  { kind: "browse", label: "Classics", row: "classics" },
  { kind: "list", label: "My list" },
];

function navKey(item: NavItem) {
  return item.kind === "browse" ? item.row : item.kind;
}

function isActive(pathname: string, item: NavItem) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (item.kind === "home") return path === "/watch";
  if (item.kind === "list") return path === "/watch/my-list";
  if (item.kind === "catalog") return path === "/watch/catalog" || path.startsWith("/watch/people");
  return path === `/watch/browse/${item.row}`;
}

function NavLink({ item, className }: { item: NavItem; className: string }) {
  if (item.kind === "browse") {
    return (
      <Link to="/watch/browse/$row" params={{ row: item.row }} className={className}>
        {item.label}
      </Link>
    );
  }
  if (item.kind === "list") {
    return (
      <Link to="/watch/my-list" className={className}>
        {item.label}
      </Link>
    );
  }
  if (item.kind === "catalog") {
    return (
      <Link to="/watch/catalog" className={className}>
        {item.label}
      </Link>
    );
  }
  return (
    <Link to="/watch" className={className}>
      {item.label}
    </Link>
  );
}

export function WatchShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "/") {
        e.preventDefault();
        void navigate({ to: "/watch/search" });
      }
      if (e.key === "?") {
        e.preventDefault();
        void navigate({ to: "/watch/help" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <a
        href="#watch-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        Skip to titles
      </a>
      <header
        className={cn(
          "sticky top-0 z-40 transition-[background-color,box-shadow] duration-200",
          solid ? "bg-bg/95 shadow-[var(--shadow-border)]" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 md:h-16 md:gap-8 md:px-8">
          <Link to="/watch" className="flex items-center gap-2">
            <FilmMark className="size-5" />
            <span className="font-display text-lg tracking-tight md:text-xl">CINEMA</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Watch">
            {NAV.map((item) => (
              <NavLink
                key={navKey(item)}
                item={item}
                className={cn(
                  "flex h-11 items-center px-3 text-sm transition-colors",
                  isActive(pathname, item) ? "text-fg" : "text-muted hover:text-fg",
                )}
              />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/watch/surprise"
              className="flex size-11 items-center justify-center text-muted hover:text-fg"
              aria-label="Surprise me"
            >
              <Dices className="size-4" />
            </Link>
            <Link
              to="/watch/search"
              className="flex size-11 items-center justify-center text-muted hover:text-fg"
              aria-label="Search"
            >
              <Search className="size-4" />
            </Link>
            <Link
              to="/"
              className="hidden h-11 items-center gap-2 px-3 text-xs uppercase tracking-[0.14em] text-subtle hover:text-fg md:flex"
            >
              <Clapperboard className="size-3.5" />
              Studio
            </Link>
          </div>
        </div>
      </header>
      <div id="watch-main" className="pb-20 md:pb-0">
        {children}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-border bg-bg-elevated md:hidden" aria-label="Watch">
        {NAV.map((item) => (
          <NavLink
            key={navKey(item)}
            item={item}
            className={cn(
              "flex flex-1 items-center justify-center text-[10px] uppercase tracking-[0.12em]",
              isActive(pathname, item) ? "text-fg" : "text-subtle",
            )}
          />
        ))}
      </nav>
    </div>
  );
}

import { Link } from "@tanstack/react-router";

export function StreamFooter() {
  return (
    <footer className="mx-auto mt-8 max-w-[1400px] px-4 pb-12 pt-4 md:px-8">
      <div className="border-t border-border pt-8">
        <p className="max-w-2xl text-sm text-muted">
          CINEMA Watch is two libraries only: titles produced on this floor, and motion pictures
          that have entered the public domain in the United States. No contemporary studio catalog.
          Public-domain prints stream from the Internet Archive.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.14em] text-subtle">
          <Link to="/watch" className="hover:text-fg">
            Home
          </Link>
          <Link to="/watch/catalog" className="hover:text-fg">
            Vault
          </Link>
          <Link to="/watch/browse/$row" params={{ row: "originals" }} className="hover:text-fg">
            Originals
          </Link>
          <Link to="/watch/browse/$row" params={{ row: "classics" }} className="hover:text-fg">
            Classics
          </Link>
          <Link to="/watch/people" className="hover:text-fg">
            People
          </Link>
          <Link to="/watch/coming-soon" className="hover:text-fg">
            Coming soon
          </Link>
          <Link to="/watch/history" className="hover:text-fg">
            History
          </Link>
          <Link to="/watch/help" className="hover:text-fg">
            Shortcuts
          </Link>
          <Link to="/watch/about" className="hover:text-fg">
            About
          </Link>
          <Link to="/" className="hover:text-fg">
            Studio floor
          </Link>
        </div>
      </div>
    </footer>
  );
}

import React, { useEffect, useState } from "react";
import { Floor, JobDesk } from "./floor";
import { BrowsePage, ListPage, PlayPage, SearchPage, TitlePage, WatchHome } from "./watch";

type Route =
  | { name: "home" }
  | { name: "floor" }
  | { name: "job"; id: string }
  | { name: "watch" }
  | { name: "title"; id: string }
  | { name: "play"; id: string }
  | { name: "search"; q: string }
  | { name: "list" }
  | { name: "browse"; row: string };

function parseHash(): Route {
  const h = (location.hash || "#/").replace(/^#/, "");
  const [path, query] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = new URLSearchParams(query || "");
  if (parts[0] === "floor" && parts[1]) return { name: "job", id: parts[1] };
  if (parts[0] === "floor") return { name: "floor" };
  if (parts[0] === "watch" && parts[1] === "title" && parts[2]) return { name: "title", id: parts[2] };
  if (parts[0] === "watch" && parts[1] === "play" && parts[2]) return { name: "play", id: parts[2] };
  if (parts[0] === "watch" && parts[1] === "search") return { name: "search", q: params.get("q") || "" };
  if (parts[0] === "watch" && parts[1] === "list") return { name: "list" };
  if (parts[0] === "watch" && parts[1] === "browse" && parts[2]) return { name: "browse", row: parts[2] };
  if (parts[0] === "watch") return { name: "watch" };
  return { name: "home" };
}

export function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    if (!location.hash) location.hash = "#/";
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const hideChrome = route.name === "play";

  return (
    <div className="shell">
      {!hideChrome && (
        <header className="topbar">
          <a className="brand" href="#/">
            CINEMA
          </a>
          <nav className="nav">
            <a className={route.name === "watch" || route.name === "title" || route.name === "browse" ? "active" : ""} href="#/watch">
              Watch
            </a>
            <a className={route.name === "floor" || route.name === "job" ? "active" : ""} href="#/floor">
              Floor
            </a>
            <a className={route.name === "search" ? "active" : ""} href="#/watch/search">
              Search
            </a>
            <a className={route.name === "list" ? "active" : ""} href="#/watch/list">
              My List
            </a>
          </nav>
          <div className="grow" />
          <a className="cta" href="#/floor">
            New job
          </a>
        </header>
      )}
      {route.name === "home" && <Home />}
      {route.name === "floor" && <Floor />}
      {route.name === "job" && <JobDesk id={route.id} />}
      {route.name === "watch" && <WatchHome />}
      {route.name === "title" && <TitlePage id={route.id} />}
      {route.name === "play" && <PlayPage id={route.id} />}
      {route.name === "search" && <SearchPage q={route.q} />}
      {route.name === "list" && <ListPage />}
      {route.name === "browse" && <BrowsePage row={route.row} />}
      {!hideChrome && (
        <footer className="footer">
          CINEMA — original work and public-domain classics only. CSE jobs stay idempotent. Audit is append-only.
        </footer>
      )}
    </div>
  );
}

function Home() {
  return (
    <section className="hero">
      <div>
        <div className="eyebrow">Script to screen</div>
        <h1>The floor and the house in one building.</h1>
        <p>
          Ingest a script. Keep the job. Write frames, a plan, a breakdown, a board, a look, a bible. Then put the
          picture in the house next to pictures nobody owns anymore.
        </p>
        <div className="row" style={{ marginTop: 22 }}>
          <a className="btn" href="#/watch">
            Open the house
          </a>
          <a className="btn ghost" href="#/floor">
            Open the floor
          </a>
        </div>
      </div>
    </section>
  );
}

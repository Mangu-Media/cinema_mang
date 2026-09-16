import React, { useEffect, useMemo, useState } from "react";
import {
  STREAM_ROWS,
  formatRuntime,
  getTitle,
  iaEmbed,
  searchTitles,
  similarTo,
  titlesForRow,
  type StreamTitle,
} from "../lib/catalog";
import { continueWatching, loadWatchState, setProgress, toggleList, type WatchState } from "../lib/watch-state";
import { NIGHT_SHIFT } from "../lib/night-shift";

export function WatchHome() {
  const [state, setState] = useState<WatchState>(loadWatchState());
  const hero = getTitle("night-shift")!;
  const cont = continueWatching();
  return (
    <div>
      <Hero title={hero} listed={state.list.includes(hero.id)} onList={() => setState(toggleList(hero.id))} />
      {STREAM_ROWS.map((row) => {
        const titles = titlesForRow(row.id, cont);
        if (!titles.length) return null;
        return <TitleRow key={row.id} label={row.label} rowId={row.id} titles={titles} />;
      })}
    </div>
  );
}

function Hero({ title, listed, onList }: { title: StreamTitle; listed: boolean; onList: () => void }) {
  return (
    <section className="hero">
      <div>
        <div className="eyebrow">{title.kind === "original" ? "Original" : "Vault"}</div>
        <h1>{title.title}</h1>
        <p>{title.synopsis}</p>
        <div className="row" style={{ marginTop: 18 }}>
          <a className="btn" href={`#/watch/play/${title.id}`}>
            Play
          </a>
          <a className="btn ghost" href={`#/watch/title/${title.id}`}>
            Title
          </a>
          <button className="btn ghost" onClick={onList}>
            {listed ? "On list" : "My list"}
          </button>
        </div>
      </div>
    </section>
  );
}

function TitleRow({ label, rowId, titles }: { label: string; rowId: string; titles: StreamTitle[] }) {
  return (
    <section className="page" style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="eyebrow">{label}</div>
        <a href={`#/watch/browse/${rowId}`} style={{ color: "var(--muted)", fontSize: 12 }}>
          See all
        </a>
      </div>
      <div className="row-scroll">
        {titles.map((t) => (
          <a key={t.id} className="card" href={`#/watch/title/${t.id}`}>
            <VaultArt title={t} />
          </a>
        ))}
      </div>
    </section>
  );
}

function VaultArt({ title }: { title: StreamTitle }) {
  return (
    <div className="vault">
      <div>
        <div className="y">
          {title.year} · {formatRuntime(title.runtimeMin)}
        </div>
        <div className="t">{title.title}</div>
      </div>
    </div>
  );
}

export function TitlePage({ id }: { id: string }) {
  const title = getTitle(id);
  const [state, setState] = useState(loadWatchState());
  if (!title) return <div className="page">Title missing.</div>;
  const listed = state.list.includes(title.id);
  return (
    <div>
      <Hero title={title} listed={listed} onList={() => setState(toggleList(title.id))} />
      <div className="page">
        <div className="chips">
          {title.genres.map((g) => (
            <span className="chip" key={g}>
              {g}
            </span>
          ))}
          <span className="chip">{title.kind}</span>
        </div>
        <TitleRow label="More like this" rowId="similar" titles={similarTo(title.id)} />
      </div>
    </div>
  );
}

export function PlayPage({ id }: { id: string }) {
  const title = getTitle(id);
  if (!title) return <div className="page">Title missing.</div>;
  return (
    <div className="player-wrap">
      <div className="player-bar">
        <a href={`#/watch/title/${id}`}>Back</a>
        <div className="grow">{title.title}</div>
      </div>
      {title.ia ? (
        <iframe className="player-frame" title={title.title} src={iaEmbed(title.ia)} allowFullScreen />
      ) : (
        <Animatic title={title} />
      )}
    </div>
  );
}

function Animatic({ title }: { title: StreamTitle }) {
  const shots =
    title.id === "night-shift"
      ? NIGHT_SHIFT.shots
      : [{ shot_index: 1, description: title.synopsis, duration_s: 6, shot_type: "WIDE" }];
  const [i, setI] = useState(0);
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const dur = shots[i]?.duration_s || 5;
    if (t >= dur) {
      setT(0);
      setI((n) => (n + 1) % shots.length);
    }
  }, [t, i, shots]);
  useEffect(() => {
    setProgress(title.id, i * 5 + t);
  }, [i, t, title.id]);
  const shot = shots[i];
  return (
    <div className="hero ken" style={{ minHeight: "78vh" }}>
      <div>
        <div className="eyebrow">
          {shot.shot_type} · {i + 1}/{shots.length}
        </div>
        <h1>{title.title}</h1>
        <p>{shot.description}</p>
      </div>
    </div>
  );
}

export function SearchPage({ q }: { q: string }) {
  const [value, setValue] = useState(q);
  const results = useMemo(() => searchTitles(value), [value]);
  return (
    <div className="page">
      <div className="eyebrow">Search</div>
      <h1>The house</h1>
      <input
        type="text"
        value={value}
        placeholder="Title, year, genre"
        onChange={(e) => {
          setValue(e.target.value);
          location.hash = `#/watch/search?q=${encodeURIComponent(e.target.value)}`;
        }}
      />
      <div className="row-scroll" style={{ flexWrap: "wrap" }}>
        {results.map((t) => (
          <a key={t.id} className="card" href={`#/watch/title/${t.id}`}>
            <VaultArt title={t} />
          </a>
        ))}
      </div>
    </div>
  );
}

export function ListPage() {
  const state = loadWatchState();
  const titles = state.list.map(getTitle).filter((t): t is StreamTitle => Boolean(t));
  return (
    <div className="page">
      <div className="eyebrow">My list</div>
      <h1>Held titles</h1>
      <p style={{ color: "var(--muted)" }}>Stored in this browser only. No accounts.</p>
      <div className="row-scroll" style={{ flexWrap: "wrap" }}>
        {titles.length === 0 && <p>Nothing held.</p>}
        {titles.map((t) => (
          <a key={t.id} className="card" href={`#/watch/title/${t.id}`}>
            <VaultArt title={t} />
          </a>
        ))}
      </div>
    </div>
  );
}

export function BrowsePage({ row }: { row: string }) {
  const meta = STREAM_ROWS.find((r) => r.id === row);
  const titles = titlesForRow(row, continueWatching());
  return (
    <div className="page">
      <div className="eyebrow">Row</div>
      <h1>{meta?.label || row}</h1>
      <div className="row-scroll" style={{ flexWrap: "wrap" }}>
        {titles.map((t) => (
          <a key={t.id} className="card" href={`#/watch/title/${t.id}`}>
            <VaultArt title={t} />
          </a>
        ))}
      </div>
    </div>
  );
}

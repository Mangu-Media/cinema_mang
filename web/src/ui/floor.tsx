import React, { useEffect, useState } from "react";
import { API_BASE, artifactUrl, getEvents, getJob, listJobs, submitJob, type JobEvent, type JobRow } from "../lib/cse";

export function Floor() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [jobId, setJobId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      setJobs(await listJobs());
    } catch (e: any) {
      setError(String(e.message || e));
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, []);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      const res = await submitJob({
        jobId: jobId || undefined,
        scriptText: script,
        parameters: { pages_per_day: 4 },
      });
      location.hash = `#/floor/${res.job_id}`;
    } catch (e: any) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="eyebrow">Production floor</div>
      <h1>Ingest</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Same contract as the CSE spine: optional job id, idempotent submit, artifacts under jobs/{""}{"{id}"}, append-only
        events. API {API_BASE}
      </p>
      {error && <p className="error">{error}</p>}
      <div className="grid-2">
        <div>
          <label className="eyebrow">Script</label>
          <textarea value={script} onChange={(e) => setScript(e.target.value)} />
          <div className="row" style={{ marginTop: 12 }}>
            <input type="text" placeholder="job id — blank to mint" value={jobId} onChange={(e) => setJobId(e.target.value)} />
            <button className="btn" onClick={onSubmit} disabled={busy}>
              {busy ? "Queuing" : "Submit job"}
            </button>
          </div>
        </div>
        <div>
          <div className="eyebrow">Jobs</div>
          <table className="table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ color: "var(--muted)" }}>
                    No jobs yet, or API offline. Locked original: <a href="#/watch/title/night-shift">Night Shift</a>
                  </td>
                </tr>
              )}
              {jobs.map((j) => (
                <tr key={j.job_id}>
                  <td>
                    <a href={`#/floor/${j.job_id}`}>{j.job_id}</a>
                  </td>
                  <td className={`status ${j.status}`}>{j.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function JobDesk({ id }: { id: string }) {
  const [job, setJob] = useState<JobRow | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [tab, setTab] = useState<"audit" | "frames" | "plan" | "break" | "board" | "look" | "bible">("audit");
  const [payload, setPayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [j, e] = await Promise.all([getJob(id), getEvents(id)]);
      setJob(j);
      setEvents(e);
    } catch (err: any) {
      setError(String(err.message || err));
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [id]);

  const artifactForTab: Record<string, string> = {
    frames: "semantic_frames",
    plan: "cinematic_plan",
    break: "breakdown",
    board: "stripboard",
    look: "lookbook",
    bible: "bible",
  };

  useEffect(() => {
    const name = artifactForTab[tab];
    if (!name || !job?.artifacts?.[name]) {
      setPayload(null);
      return;
    }
    artifactUrl(id, name)
      .then((url) => fetch(url).then((r) => r.json()))
      .then(setPayload)
      .catch(() => setPayload(null));
  }, [tab, job, id]);

  return (
    <div className="page">
      <div className="eyebrow">Job</div>
      <h1>{id}</h1>
      {error && <p className="error">{error}</p>}
      <p>
        Status <span className={`status ${job?.status || ""}`}>{job?.status || "—"}</span>
      </p>
      <div className="nav row" style={{ margin: "12px 0 20px" }}>
        {(["audit", "frames", "plan", "break", "board", "look", "bible"] as const).map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {tab === "audit" && (
        <div className="audit">
          {events.map((e) => (
            <div className="evt" key={e.id}>
              <b>{e.type}</b> — {e.message}
              <div>{e.at}</div>
            </div>
          ))}
          {events.length === 0 && <div>No events yet.</div>}
        </div>
      )}
      {tab !== "audit" && (
        <pre className="audit">{payload ? JSON.stringify(payload, null, 2) : "Artifact not written, or storage unreachable."}</pre>
      )}
      <div className="row" style={{ marginTop: 16 }}>
        {Object.keys(job?.artifacts || {}).map((k) => (
          <button key={k} className="btn ghost" onClick={() => artifactUrl(id, k).then((u) => window.open(u, "_blank"))}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_SCRIPT = `INT. PRECINCT DESK — NIGHT
HALE keeps the book. The radio breathes static.
ROOKIE
Do we log the quiet?
HALE
We log what happened.

INT. HOLDING — NIGHT
A man sleeps sitting up. ROOKIE checks the lock twice.

EXT. PRECINCT STEPS — NIGHT
Rain already happened. HALE stands in sodium light. No cars.
`;

import React, { useMemo, useState } from "react";

type JobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

const API_BASE = (import.meta as any).env.VITE_API_BASE || "http://localhost:8000";

export function App() {
  const [jobId, setJobId] = useState("");
  const [scriptText, setScriptText] = useState("INT. ROOM\nA PERSON walks.\n");
  const [status, setStatus] = useState<JobStatus | "">("");
  const [artifacts, setArtifacts] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canPoll = useMemo(() => jobId.trim().length > 0, [jobId]);

  async function submit() {
    setError(null);
    const fd = new FormData();
    if (jobId.trim()) fd.set("job_id", jobId.trim());
    fd.set("script_text", scriptText);

    const res = await fetch(`${API_BASE}/v1/jobs`, { method: "POST", body: fd });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const data = await res.json();
    setJobId(data.job_id);
    await refresh(data.job_id);
  }

  async function refresh(id = jobId) {
    setError(null);
    if (!id.trim()) return;

    const [s, e] = await Promise.all([
      fetch(`${API_BASE}/v1/jobs/${id}`).then((r) => r.json()),
      fetch(`${API_BASE}/v1/jobs/${id}/events`).then((r) => r.json()),
    ]);
    setStatus(s.status);
    setArtifacts(s.artifacts || {});
    setEvents(e || []);
  }

  async function openArtifact(name: string) {
    const res = await fetch(`${API_BASE}/v1/jobs/${jobId}/artifacts/${name}`);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const data = await res.json();
    window.open(data.url, "_blank");
  }

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <h1>CSE Orchestrator</h1>

      {error && (
        <pre style={{ background: "#fee", padding: 12, borderRadius: 8, overflowX: "auto" }}>{error}</pre>
      )}

      <section style={{ display: "grid", gap: 12 }}>
        <label>
          Job ID (optional)
          <input
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="leave blank to auto-generate"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Script Text
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={10}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={submit} style={{ padding: "10px 14px" }}>
            Submit Job
          </button>
          <button disabled={!canPoll} onClick={() => refresh()} style={{ padding: "10px 14px" }}>
            Refresh Status
          </button>
        </div>
      </section>

      <hr style={{ margin: "18px 0" }} />

      <section>
        <h2>Status</h2>
        <div>Job: <b>{jobId || "—"}</b></div>
        <div>Status: <b>{status || "—"}</b></div>

        <h3>Artifacts</h3>
        <ul>
          {Object.keys(artifacts).length === 0 && <li>—</li>}
          {Object.keys(artifacts).map((k) => (
            <li key={k} style={{ marginBottom: 6 }}>
              <code>{k}</code>{" "}
              <button onClick={() => openArtifact(k)} style={{ padding: "4px 10px" }}>
                Open
              </button>
            </li>
          ))}
        </ul>

        <h3>Audit Events</h3>
        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, overflowX: "auto" }}>
          {JSON.stringify(events, null, 2)}
        </pre>
      </section>
    </div>
  );
}

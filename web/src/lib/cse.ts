export type JobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type JobRow = {
  job_id: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
  artifacts: Record<string, string>;
  parameters?: Record<string, unknown>;
};

export type JobEvent = {
  id: number;
  job_id: string;
  at: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
};

export const API_BASE = (import.meta as any).env.VITE_API_BASE || "http://localhost:8000";

export async function listJobs(): Promise<JobRow[]> {
  const r = await fetch(`${API_BASE}/v1/jobs`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getJob(id: string): Promise<JobRow> {
  const r = await fetch(`${API_BASE}/v1/jobs/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getEvents(id: string): Promise<JobEvent[]> {
  const r = await fetch(`${API_BASE}/v1/jobs/${id}/events`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function submitJob(input: {
  jobId?: string;
  scriptText: string;
  parameters?: Record<string, unknown>;
}): Promise<{ job_id: string; status: JobStatus }> {
  const fd = new FormData();
  if (input.jobId?.trim()) fd.set("job_id", input.jobId.trim());
  fd.set("script_text", input.scriptText);
  if (input.parameters) fd.set("parameters_json", JSON.stringify(input.parameters));
  const r = await fetch(`${API_BASE}/v1/jobs`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function artifactUrl(jobId: string, name: string): Promise<string> {
  const r = await fetch(`${API_BASE}/v1/jobs/${jobId}/artifacts/${name}`);
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.url as string;
}

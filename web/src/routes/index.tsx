import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clapperboard, MonitorPlay } from "lucide-react";
import { StudioShell } from "@/components/layout/studio-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/workspace/status-chip";
import { formatRelative } from "@/lib/cse/format";
import { listJobs, listProjects, studioStats } from "@/lib/server/jobs";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => studioStats() });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const jobs = useQuery({ queryKey: ["jobs"], queryFn: () => listJobs() });
  const s = stats.data;
  const lead = jobs.data?.[0];

  return (
    <StudioShell>
      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Floor</p>
        <h1 className="mt-2 max-w-xl font-display text-5xl font-medium tracking-tight md:text-6xl">
          Script in. Coverage, board, and days out.
        </h1>
        <p className="mt-4 max-w-lg text-sm text-muted">
          CINEMA is the Cinematic Singularity Engine — an idempotent script-to-screen floor. Semantic
          frames, cinematic plans, breakdown, stripboard, lookbook, and an append-only audit.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/ingest">New ingest</Link>
          </Button>
          {lead ? (
            <Button variant="secondary" asChild>
              <Link to="/jobs/$jobId" params={{ jobId: lead.id }}>
                Open {lead.title}
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link to="/watch">
              <MonitorPlay /> Open Watch
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Productions" value={s ? String(s.jobs) : "—"} />
          <Stat label="Scenes" value={s ? String(s.scenes) : "—"} />
          <Stat label="Shots" value={s ? String(s.shots) : "—"} />
          <Stat label="Locked" value={s ? String(s.locked) : "—"} />
        </div>

        <section className="mt-12 overflow-hidden rounded-[var(--radius-xl)] bg-bg-elevated shadow-[var(--shadow-border)]">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[220px] bg-surface-2">
              <img
                src="/stream/night-shift-backdrop.jpg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-6 md:p-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Watch</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight">Originals and the free vault.</h2>
              <p className="mt-3 text-sm text-muted">
                A full browse-and-play layer for two libraries only: pictures made on this floor, and
                classics in the U.S. public domain. No licensed studio catalog.
              </p>
              <div className="mt-5">
                <Button asChild>
                  <Link to="/watch">
                    <MonitorPlay /> Open the stream
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl">Slate</h2>
            <Link to="/pipeline" className="text-xs uppercase tracking-[0.14em] text-muted hover:text-fg">
              Pipeline
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(projects.data ?? []).map((p) => {
              const job = (jobs.data ?? []).find((j) => j.project_id === p.id);
              return (
                <article
                  key={p.id}
                  className="rounded-[var(--radius-xl)] bg-bg-elevated p-5 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge>{p.status}</Badge>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-subtle">{p.format}</span>
                  </div>
                  <h3 className="mt-3 font-display text-3xl leading-none">{p.title}</h3>
                  <p className="mt-3 text-sm text-muted">{p.logline}</p>
                  <div className="mt-5 flex items-center justify-between">
                    {job ? <StatusChip status={job.status} /> : <span className="text-xs text-subtle">No job</span>}
                    {job ? (
                      <Link
                        to="/jobs/$jobId"
                        params={{ jobId: job.id }}
                        className="inline-flex h-11 items-center gap-1 text-sm text-fg"
                      >
                        Open <ArrowUpRight className="size-4" />
                      </Link>
                    ) : (
                      <Link to="/ingest" className="inline-flex h-11 items-center text-sm text-muted">
                        Ingest a draft
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl">Recent jobs</h2>
          {jobs.isLoading ? (
            <p className="mt-4 text-sm text-muted">Loading the slate…</p>
          ) : jobs.isError ? (
            <p className="mt-4 text-sm text-muted">Could not read jobs. Refresh the floor.</p>
          ) : (jobs.data ?? []).length === 0 ? (
            <div className="mt-4 max-w-md rounded-[var(--radius-xl)] bg-bg-elevated p-6 shadow-[var(--shadow-border)]">
              <p className="font-display text-2xl">No jobs yet.</p>
              <p className="mt-2 text-sm text-muted">Drop a script on ingest and the pipeline will lock coverage.</p>
              <Button className="mt-5" asChild>
                <Link to="/ingest">New ingest</Link>
              </Button>
            </div>
          ) : (
          <ul className="mt-4 divide-y divide-border rounded-[var(--radius-lg)] bg-bg-elevated shadow-[var(--shadow-border)]">
            {(jobs.data ?? []).map((j) => (
              <li key={j.id}>
                <Link
                  to="/jobs/$jobId"
                  params={{ jobId: j.id }}
                  className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-surface"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Clapperboard className="size-4 shrink-0 text-muted" />
                    <div className="min-w-0">
                      <div className="truncate">{j.title}</div>
                      <div className="font-mono text-[11px] text-subtle">{j.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusChip status={j.status} />
                    <span className="hidden text-xs text-subtle sm:inline">{formatRelative(j.updated_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          )}
        </section>
      </main>
    </StudioShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
      <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">{label}</div>
      <div className="mt-1 font-display text-3xl tabular">{value}</div>
    </div>
  );
}

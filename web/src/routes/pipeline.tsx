import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StudioShell } from "@/components/layout/studio-shell";
import { Button } from "@/components/ui/button";
import { PipelineRail } from "@/components/workspace/pipeline-rail";
import { StatusChip } from "@/components/workspace/status-chip";
import { formatRelative } from "@/lib/cse/format";
import type { JobStatus, PipelineStage } from "@/lib/cse/types";
import { listJobs } from "@/lib/server/jobs";

export const Route = createFileRoute("/pipeline")({ component: PipelinePage });

const COLS: JobStatus[] = ["PENDING", "RUNNING", "SUCCEEDED", "FAILED"];

function PipelinePage() {
  const jobs = useQuery({ queryKey: ["jobs"], queryFn: () => listJobs() });
  const list = jobs.data ?? [];

  return (
    <StudioShell>
      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Pipeline</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Every job, every state.</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Submitting an existing job ID returns current state — no restart. Every transition is
          appended to the audit log.
        </p>

        {jobs.isError ? (
          <div className="mt-10 max-w-md rounded-[var(--radius-xl)] bg-bg-elevated p-6 shadow-[var(--shadow-border)]">
            <p className="font-display text-2xl">The board did not load.</p>
            <p className="mt-2 text-sm text-muted">The jobs query failed. Retry, or ingest a script.</p>
            <Button className="mt-5" onClick={() => void jobs.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLS.map((status) => {
              const items = list.filter((j) => j.status === status);
              const waiting = jobs.isLoading || jobs.isPending;
              return (
                <section key={status} className="rounded-[var(--radius-xl)] bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
                  <div className="mb-3 flex items-center justify-between">
                    <StatusChip status={status} />
                    <span className="font-mono text-xs text-subtle">{waiting ? "—" : items.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {waiting ? (
                      <li className="px-1 py-6 text-center text-xs text-subtle">Loading…</li>
                    ) : items.length === 0 ? (
                      <li className="px-1 py-6 text-center text-xs text-subtle">Empty</li>
                    ) : null}
                    {items.map((j) => (
                      <li key={j.id}>
                        <Link
                          to="/jobs/$jobId"
                          params={{ jobId: j.id }}
                          className="block rounded-[var(--radius-md)] bg-surface p-3 shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
                        >
                          <div className="truncate text-sm">{j.title}</div>
                          <div className="mt-1 font-mono text-[10px] text-subtle">{j.id}</div>
                          <div className="mt-3">
                            <PipelineRail stage={j.stage as PipelineStage} compact />
                          </div>
                          <div className="mt-2 text-[11px] text-subtle">{formatRelative(j.updated_at)}</div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </StudioShell>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { StudioShell } from "@/components/layout/studio-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { NIGHT_SHIFT_SCRIPT } from "@/lib/cse/seed-script";
import type { CoverageDensity } from "@/lib/cse/types";
import { listProjects, runPipeline, submitJob } from "@/lib/server/jobs";

export const Route = createFileRoute("/ingest")({ component: IngestPage });

function IngestPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const [title, setTitle] = useState("");
  const [jobId, setJobId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [genre, setGenre] = useState("neo-noir");
  const [look, setLook] = useState("sodium night / wet asphalt");
  const [density, setDensity] = useState<CoverageDensity>("standard");
  const [runtime, setRuntime] = useState(12);
  const [script, setScript] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const created = await submitJob({
        data: {
          jobId: jobId.trim() || undefined,
          projectId: projectId || undefined,
          title: title.trim() || "Untitled",
          scriptText: script,
          parameters: {
            genre,
            look,
            coverage_density: density,
            target_runtime_min: runtime,
          },
        },
      });
      if (!created.idempotent) {
        const pipe = await runPipeline({ data: { jobId: created.job_id, useAi: true } });
        if (!pipe.ok) {
          return { ...created, pipelineError: pipe.error };
        }
      }
      return { ...created, pipelineError: undefined };
    },
    onSuccess: (res) => {
      void qc.invalidateQueries();
      if (res.pipelineError) {
        toast.error(res.pipelineError);
      } else {
        toast.success(res.idempotent ? "Existing job returned (idempotent)" : "Pipeline locked");
      }
      void nav({ to: "/jobs/$jobId", params: { jobId: res.job_id } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Submit failed"),
  });

  return (
    <StudioShell>
      <main className="mx-auto max-w-[980px] px-4 py-8 md:px-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Ingest</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Drop a script on the floor.</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Fountain-style sluglines (INT./EXT.). Same job ID will not restart a running or locked
          production — idempotent by design.
        </p>

        <form
          className="mt-8 grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Night Shift" />
            </Field>
            <Field label="Job ID (optional)">
              <Input
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="leave blank to mint"
              />
            </Field>
            <Field label="Project">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-11 w-full rounded-[var(--radius-sm)] bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
              >
                <option value="">Create new project</option>
                {(projects.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Genre">
              <Input value={genre} onChange={(e) => setGenre(e.target.value)} />
            </Field>
            <Field label="Look">
              <Input value={look} onChange={(e) => setLook(e.target.value)} />
            </Field>
            <Field label="Coverage">
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value as CoverageDensity)}
                className="h-11 w-full rounded-[var(--radius-sm)] bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
              >
                <option value="economy">Economy</option>
                <option value="standard">Standard</option>
                <option value="full">Full</option>
              </select>
            </Field>
            <Field label="Target runtime (min)">
              <Input
                type="number"
                min={3}
                max={180}
                value={runtime}
                onChange={(e) => setRuntime(Number(e.target.value) || 12)}
              />
            </Field>
          </div>

          <Field label="Screenplay">
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={16}
              placeholder="INT. ROOM - NIGHT"
              className="min-h-72 font-mono text-[13px] leading-relaxed"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submit.isPending || !script.trim()}>
              {submit.isPending ? "Running pipeline…" : "Submit job"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setTitle("Night Shift");
                setScript(NIGHT_SHIFT_SCRIPT);
                setGenre("neo-noir");
              }}
            >
              Load sample
            </Button>
          </div>
        </form>
      </main>
    </StudioShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Aperture,
  Clapperboard,
  Clock,
  Download,
  Film,
  ListTree,
  MonitorPlay,
  Play,
  ScrollText,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StoryboardFrame } from "@/components/workspace/storyboard-frame";
import { ScriptView } from "@/components/workspace/script-view";
import { PipelineRail } from "@/components/workspace/pipeline-rail";
import { StatusChip } from "@/components/workspace/status-chip";
import { cn } from "@/lib/cn";
import {
  asNumber,
  formatMoney,
  formatPages,
  formatRelative,
  formatTimecode,
  parseJson,
  shotTypeLabel,
  stripColor,
} from "@/lib/cse/format";
import { budgetFromBreakdown } from "@/lib/cse/production";
import type { Camera, JobBundle, Lookbook, PipelineStage } from "@/lib/cse/types";
import { generateShotStill, getJobBundle, runPipeline } from "@/lib/server/jobs";

const TABS = [
  { id: "script", label: "Script", icon: ScrollText },
  { id: "shots", label: "Shots", icon: Aperture },
  { id: "board", label: "Board", icon: Film },
  { id: "breakdown", label: "Breakdown", icon: ListTree },
  { id: "schedule", label: "Schedule", icon: Clock },
  { id: "look", label: "Look", icon: Sparkles },
  { id: "audit", label: "Audit", icon: Clapperboard },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function JobWorkspace({ jobId }: { jobId: string }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("script");
  const [sceneIndex, setSceneIndex] = useState<number | undefined>(1);
  const [playing, setPlaying] = useState(false);
  const [playHead, setPlayHead] = useState(0);

  const q = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobBundle({ data: { jobId } }),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = Number(e.key);
      if (n >= 1 && n <= TABS.length) {
        e.preventDefault();
        const next = TABS[n - 1];
        if (next) setTab(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = useMutation({
    mutationFn: () => runPipeline({ data: { jobId, useAi: true } }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["job", jobId] });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
      if (res.ok) toast.success(`Pipeline locked · ${res.shots} shots`);
      else toast.error(res.error);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Pipeline failed"),
  });

  const still = useMutation({
    mutationFn: (shotId: string) => generateShotStill({ data: { shotId } }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["job", jobId] });
      if (res.url) toast.success("Still generated");
      else toast.error(res.error ?? "Unavailable");
    },
  });

  const raw = q.data as JobBundle | null | undefined;
  if (q.isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Production</p>
        <h1 className="mt-2 font-display text-4xl">Loading the floor…</h1>
        <p className="mt-3 text-sm text-muted">Pulling script, shots, and the audit log.</p>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-[var(--radius-md)] bg-surface" />
          ))}
        </div>
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-4xl">The floor did not answer.</h1>
        <p className="mt-3 text-sm text-muted">Try the pipeline list, or ingest again.</p>
        <Button asChild className="mt-6">
          <Link to="/pipeline">Back to pipeline</Link>
        </Button>
      </div>
    );
  }
  if (!raw) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-4xl">This job is not on the floor.</h1>
        <p className="mt-3 text-sm text-muted">It may have been a working title. Return to the pipeline.</p>
        <Button asChild className="mt-6">
          <Link to="/pipeline">Back to pipeline</Link>
        </Button>
      </div>
    );
  }
  const bundle: JobBundle = raw;

  const totalDur = bundle.shots.reduce((s, sh) => s + asNumber(sh.duration_s), 0);
  const pages = bundle.scenes.reduce((s, sc) => s + asNumber(sc.pages), 0);
  const budget = budgetFromBreakdown(
    bundle.breakdown.map((b) => ({ category: b.category, quantity: b.quantity })),
    Math.max(1, bundle.days.length),
  );

  function exportPackage() {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bundle.job.id}.cinema.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={bundle.job.status} />
            <Badge>{bundle.project?.genre || "unspecified"}</Badge>
            <span className="font-mono text-[11px] text-subtle">{bundle.job.id}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
            {bundle.job.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{bundle.project?.logline}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? "Running…" : bundle.job.status === "SUCCEEDED" ? "Re-run pipeline" : "Run pipeline"}
          </Button>
          <Button variant="secondary" onClick={exportPackage}>
            <Download /> Export
          </Button>
          {bundle.job.id === "job_night_shift" ? (
            <Button variant="outline" asChild>
              <Link to="/watch/title/$titleId" params={{ titleId: "night-shift" }}>
                <MonitorPlay /> Open in Watch
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {bundle.job.status === "FAILED" ? (
        <div className="mt-6 rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-record">Failed</p>
          <p className="mt-2 text-sm text-muted">
            {bundle.job.error_message || "The pipeline did not lock. Run it again from this page."}
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Scenes" value={String(bundle.scenes.length)} />
        <Kpi label="Shots" value={String(bundle.shots.length)} />
        <Kpi label="Pages" value={formatPages(pages)} />
        <Kpi label="Animatic" value={formatTimecode(totalDur)} />
        <Kpi label="Budget" value={formatMoney(budget.total)} />
      </div>

      <div className="mt-5 rounded-[var(--radius-lg)] bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
        <PipelineRail stage={bundle.job.stage as PipelineStage} compact />
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Production">
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              id={`job-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm transition-colors",
                active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
              )}
            >
              <Icon className="size-4" />
              {t.label}
              <span className="hidden font-mono text-[10px] text-subtle lg:inline">{i + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "script" && (
          <ScriptView
            script={bundle.job.script_text}
            scenes={bundle.scenes}
            selectedIndex={sceneIndex}
            onSelect={setSceneIndex}
          />
        )}
        {tab === "shots" && <ShotTable bundle={bundle} />}
        {tab === "board" && (
          <Board
            bundle={bundle}
            playing={playing}
            playHead={playHead}
            onPlay={() => {
              setPlaying(true);
              setPlayHead(0);
              const shots = bundle.shots;
              let acc = 0;
              shots.forEach((sh, i) => {
                window.setTimeout(() => setPlayHead(i), acc * 180);
                acc += asNumber(sh.duration_s);
              });
              window.setTimeout(() => setPlaying(false), acc * 180 + 400);
            }}
            onGenerate={(id) => still.mutate(id)}
            generating={still.isPending}
          />
        )}
        {tab === "breakdown" && <BreakdownView bundle={bundle} budget={budget} />}
        {tab === "schedule" && <ScheduleView bundle={bundle} />}
        {tab === "look" && <LookView bundle={bundle} />}
        {tab === "audit" && <AuditView bundle={bundle} />}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
      <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">{label}</div>
      <div className="mt-1 font-display text-2xl tabular tracking-tight">{value}</div>
    </div>
  );
}

function ShotTable({ bundle }: { bundle: JobBundle }) {
  const [sceneFilter, setSceneFilter] = useState<number>(0);
  const sceneById = useMemo(() => new Map(bundle.scenes.map((s) => [s.id, s])), [bundle.scenes]);
  const rows = sceneFilter
    ? bundle.shots.filter((s) => sceneById.get(s.scene_id)?.scene_index === sceneFilter)
    : bundle.shots;

  if (!bundle.shots.length) {
    return (
      <div className="max-w-md rounded-[var(--radius-xl)] bg-bg-elevated p-6 shadow-[var(--shadow-border)]">
        <p className="font-display text-2xl">No coverage yet.</p>
        <p className="mt-2 text-sm text-muted">Run the pipeline to lock shots from the script.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSceneFilter(0)}
          className={cn(
            "h-9 rounded-full px-3 text-xs",
            !sceneFilter ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted",
          )}
        >
          All
        </button>
        {bundle.scenes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSceneFilter(s.scene_index)}
            className={cn(
              "h-9 rounded-full px-3 text-xs",
              sceneFilter === s.scene_index ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted",
            )}
          >
            {s.scene_index}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] shadow-[var(--shadow-border)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-bg-elevated text-[10px] uppercase tracking-[0.14em] text-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Dur</th>
              <th className="px-4 py-3 font-medium">Lens</th>
              <th className="px-4 py-3 font-medium">Move</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((sh) => {
              const cam = parseJson<Camera>(sh.camera, {
                focal_length_mm: 35,
                movement: "STATIC",
                height_m: 1.6,
                target: "SUBJECT",
                angle: "eye-level",
              });
              return (
                <tr key={sh.id} className="border-t border-border bg-surface/40">
                  <td className="px-4 py-3 font-mono text-xs">{sh.shot_code}</td>
                  <td className="px-4 py-3">{shotTypeLabel(sh.shot_type)}</td>
                  <td className="px-4 py-3 tabular">{asNumber(sh.duration_s).toFixed(1)}s</td>
                  <td className="px-4 py-3 tabular">{cam.focal_length_mm}mm</td>
                  <td className="px-4 py-3 text-muted">{cam.movement}</td>
                  <td className="px-4 py-3 text-muted">{sh.coverage_role}</td>
                  <td className="px-4 py-3 text-muted">{sh.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Board({
  bundle,
  playing,
  playHead,
  onPlay,
  onGenerate,
  generating,
}: {
  bundle: JobBundle;
  playing: boolean;
  playHead: number;
  onPlay: () => void;
  onGenerate: (id: string) => void;
  generating: boolean;
}) {
  const current = bundle.shots[playHead];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Letterboxed coverage board. Generate up to four photochemical stills.</p>
        <Button variant="secondary" onClick={onPlay} disabled={!bundle.shots.length}>
          <Play /> {playing ? "Playing" : "Play animatic"}
        </Button>
      </div>
      {current && playing && (
        <div className="mb-6 max-w-xl">
          <StoryboardFrame
            shotType={current.shot_type}
            code={current.shot_code}
            promptUrl={current.storyboard_url}
            className="rounded-[var(--radius-lg)]"
          />
          <p className="mt-2 text-sm text-muted">{current.description}</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {bundle.shots.map((sh) => (
          <div key={sh.id} className="rounded-[var(--radius-xl)] bg-bg-elevated p-3 shadow-[var(--shadow-border)]">
            <StoryboardFrame shotType={sh.shot_type} code={sh.shot_code} promptUrl={sh.storyboard_url} />
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-sm">{shotTypeLabel(sh.shot_type)}</div>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{sh.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={generating || Boolean(sh.storyboard_url)}
                onClick={() => onGenerate(sh.id)}
              >
                Still
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownView({
  bundle,
  budget,
}: {
  bundle: JobBundle;
  budget: { total: number; lines: { category: string; amount: number }[] };
}) {
  const grouped = new Map<string, typeof bundle.breakdown>();
  for (const item of bundle.breakdown) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }
  const sceneName = (id: string) => bundle.scenes.find((s) => s.id === id)?.heading ?? id;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        {[...grouped.entries()].map(([cat, items]) => (
          <section key={cat}>
            <h3 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-subtle">{cat}</h3>
            <ul className="divide-y divide-border rounded-[var(--radius-lg)] bg-bg-elevated shadow-[var(--shadow-border)]">
              {items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <div className="text-sm">{it.name}</div>
                    <div className="text-xs text-muted">
                      {sceneName(it.scene_id)} · {it.notes}
                    </div>
                  </div>
                  <span className="font-mono text-xs tabular text-subtle">×{it.quantity}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <aside className="h-fit rounded-[var(--radius-xl)] bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-subtle">
          <Wallet className="size-3.5" /> Rough below-the-line
        </div>
        <div className="mt-2 font-display text-3xl tabular">{formatMoney(budget.total)}</div>
        <Separator className="my-4" />
        <ul className="space-y-2 text-sm">
          {budget.lines.map((l) => (
            <li key={l.category} className="flex justify-between gap-3">
              <span className="text-muted">{l.category}</span>
              <span className="tabular">{formatMoney(l.amount)}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function ScheduleView({ bundle }: { bundle: JobBundle }) {
  return (
    <div className="space-y-8">
      {bundle.days.map((day) => {
        const strips = bundle.strips.filter((s) => s.day_id === day.id);
        return (
          <section key={day.id}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-display text-2xl">{day.label}</h3>
                <p className="text-sm text-muted">{day.location}</p>
              </div>
              <div className="text-xs tabular text-subtle">
                {formatPages(asNumber(day.estimated_pages))} pg · {asNumber(day.estimated_hours)} hrs
              </div>
            </div>
            <div className="space-y-2">
              {strips.map((st) => {
                const scene = bundle.scenes.find((s) => s.id === st.scene_id);
                const color = stripColor(scene?.slugline_kind ?? "INT", scene?.time_of_day ?? "DAY");
                return (
                  <div
                    key={st.id}
                    className={cn(
                      "flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-sm)] px-4",
                      color,
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs">{scene?.scene_index}</span>
                      <div>
                        <div className="text-sm font-medium">{scene?.heading}</div>
                        {st.company_move ? <div className="text-[11px] opacity-80">Company move</div> : null}
                      </div>
                    </div>
                    <span className="font-mono text-xs">{formatPages(asNumber(st.pages))}</span>
                  </div>
                );
              })}
            </div>
            <CallSheet day={day} strips={strips} bundle={bundle} />
          </section>
        );
      })}
    </div>
  );
}

function CallSheet({
  day,
  strips,
  bundle,
}: {
  day: JobBundle["days"][number];
  strips: JobBundle["strips"];
  bundle: JobBundle;
}) {
  const sceneIds = new Set(strips.map((s) => s.scene_id));
  const cast = bundle.breakdown.filter((b) => b.category === "CAST" && sceneIds.has(b.scene_id));
  const names = [...new Set(cast.map((c) => c.name))];
  return (
    <div className="mt-4 rounded-[var(--radius-lg)] bg-bg-elevated p-4 text-sm shadow-[var(--shadow-border)]">
      <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">Call sheet</div>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xs text-subtle">General crew call</div>
          <div className="tabular">06:00</div>
        </div>
        <div>
          <div className="text-xs text-subtle">Cast</div>
          <div>{names.join(", ") || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-subtle">Notes</div>
          <div className="text-muted">{day.notes}</div>
        </div>
      </div>
    </div>
  );
}

function LookView({ bundle }: { bundle: JobBundle }) {
  const art = bundle.artifacts.find((a) => a.name === "lookbook");
  const look = parseJson<Lookbook | null>(art?.payload as unknown as Lookbook | string, null);
  if (!look) return <p className="text-sm text-muted">Run the pipeline to lock a lookbook.</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div>
        <h3 className="font-display text-3xl">{look.title}</h3>
        <p className="mt-2 text-muted">{look.visual_thesis}</p>
        <div className="mt-6 space-y-4">
          {look.color_script.map((row) => (
            <div key={row.scene_index} className="flex items-center gap-3">
              <span className="w-8 font-mono text-xs text-subtle">{row.scene_index}</span>
              <div className="flex gap-1">
                {row.palette.map((c) => (
                  <span
                    key={c}
                    className="size-8 rounded-[var(--radius-xs)] shadow-[var(--shadow-border)]"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              <span className="text-xs text-muted">{row.note}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <section className="rounded-[var(--radius-xl)] bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
          <h4 className="text-[11px] uppercase tracking-[0.16em] text-subtle">Camera grammar</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {look.camera_grammar.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-[var(--radius-xl)] bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
          <h4 className="text-[11px] uppercase tracking-[0.16em] text-subtle">Light / sound</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {[...look.lighting_notes, ...look.sound_notes].map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function AuditView({ bundle }: { bundle: JobBundle }) {
  return (
    <ol className="relative space-y-0 border-l border-border pl-6">
      {bundle.events.map((ev) => {
        const data = parseJson<Record<string, unknown>>(ev.data, {});
        return (
          <li key={ev.id} className="relative pb-6">
            <span className="absolute -left-[29px] top-1 size-2.5 rounded-full bg-primary" />
            <div className="text-[11px] uppercase tracking-[0.14em] text-subtle">{ev.type}</div>
            <div className="text-sm">{ev.message}</div>
            <div className="mt-1 font-mono text-[11px] text-subtle">
              {formatRelative(ev.at)} · {Object.keys(data).length ? JSON.stringify(data) : "—"}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

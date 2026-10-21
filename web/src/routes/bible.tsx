import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StudioShell } from "@/components/layout/studio-shell";
import { Badge } from "@/components/ui/badge";
import { listEntities } from "@/lib/server/jobs";

export const Route = createFileRoute("/bible")({ component: BiblePage });

function BiblePage() {
  const q = useQuery({ queryKey: ["bible"], queryFn: () => listEntities() });
  const rows = q.data ?? [];
  const kinds = [...new Set(rows.map((r) => r.kind))];

  return (
    <StudioShell>
      <main className="mx-auto max-w-[1100px] px-4 py-8 md:px-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">Bible</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Characters, places, things.</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Continuity extracted from every locked production. First appearance is scene index.
        </p>

        {kinds.map((kind) => (
          <section key={kind} className="mt-10">
            <h2 className="text-[11px] uppercase tracking-[0.16em] text-subtle">{kind}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows
                .filter((r) => r.kind === kind)
                .map((r) => (
                  <li
                    key={r.id}
                    className="rounded-[var(--radius-lg)] bg-bg-elevated p-4 shadow-[var(--shadow-border)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{r.name}</div>
                      <Badge>sc. {r.first_scene}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted">{r.description}</p>
                    <Link
                      to="/jobs/$jobId"
                      params={{ jobId: r.job_id }}
                      className="mt-3 inline-flex h-10 items-center text-xs uppercase tracking-[0.14em] text-subtle hover:text-fg"
                    >
                      {r.job_title}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </main>
    </StudioShell>
  );
}

import type { StreamTitle } from "@/lib/stream/types";
import { TitleCard } from "./title-card";

export function CatalogGrid({
  titles,
  progress,
  empty,
}: {
  titles: StreamTitle[];
  progress?: Record<string, number>;
  empty?: string;
}) {
  if (!titles.length) {
    return (
      <p className="mt-8 max-w-lg text-sm text-muted">
        {empty ?? "Nothing in the vault matches. Originals and public-domain prints only."}
      </p>
    );
  }
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {titles.map((t) => (
        <TitleCard key={t.id} title={t} fill progress={progress?.[t.id]} />
      ))}
    </div>
  );
}

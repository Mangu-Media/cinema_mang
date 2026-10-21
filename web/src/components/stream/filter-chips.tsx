import { cn } from "@/lib/cn";
import { allDecades } from "@/lib/stream/catalog-query";
import { STREAM_GENRES, type CatalogQuery, type RuntimeBucket } from "@/lib/stream/types";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-11 shrink-0 items-center rounded-full px-4 text-xs uppercase tracking-[0.12em]",
        active ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

export function FilterChips({
  value,
  onChange,
  genres,
}: {
  value: CatalogQuery;
  onChange: (next: CatalogQuery) => void;
  genres?: readonly string[];
}) {
  const decades = allDecades();
  const genreList = genres ?? STREAM_GENRES;

  function toggle<K extends keyof CatalogQuery>(key: K, next: CatalogQuery[K]) {
    onChange({ ...value, [key]: value[key] === next ? undefined : next });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Origin">
        <Chip active={!value.origin} onClick={() => onChange({ ...value, origin: undefined })}>
          All
        </Chip>
        <Chip active={value.origin === "original"} onClick={() => toggle("origin", "original")}>
          Originals
        </Chip>
        <Chip
          active={value.origin === "public_domain"}
          onClick={() => toggle("origin", "public_domain")}
        >
          Public domain
        </Chip>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Runtime">
        {(["short", "feature", "epic"] as RuntimeBucket[]).map((bucket) => (
          <Chip key={bucket} active={value.runtime === bucket} onClick={() => toggle("runtime", bucket)}>
            {bucket === "short" ? "Shorts" : bucket === "epic" ? "Over 2h" : "Features"}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Decade">
        {decades.map((d) => (
          <Chip key={d} active={value.decade === d} onClick={() => toggle("decade", d)}>
            {d}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Genre">
        {genreList.map((g) => (
          <Chip key={g} active={value.genre === g} onClick={() => toggle("genre", g)}>
            {g}
          </Chip>
        ))}
      </div>
    </div>
  );
}

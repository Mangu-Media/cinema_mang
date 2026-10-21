import { useState } from "react";
import { cn } from "@/lib/cn";

export function PosterImg({
  src,
  title,
  year,
  className,
  wide,
}: {
  src: string;
  title: string;
  year?: number;
  className?: string;
  wide?: boolean;
}) {
  const remote = !src || src.includes("archive.org");
  const [failed, setFailed] = useState(false);

  if (remote || failed) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full flex-col justify-end overflow-hidden bg-surface-2 px-3 py-3",
          className,
        )}
        aria-label={title}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent_58%)]" />
        <div className="grain absolute inset-0 opacity-40" />
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center font-display text-primary/25",
            wide ? "text-7xl" : "text-5xl",
          )}
        >
          {title.replace(/^The\s+/i, "").slice(0, 1)}
        </div>
        {year ? (
          <div className="relative text-[10px] uppercase tracking-[0.16em] text-subtle">{year}</div>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={cn("h-full w-full object-cover", wide && "object-center", className)}
      onError={() => setFailed(true)}
    />
  );
}

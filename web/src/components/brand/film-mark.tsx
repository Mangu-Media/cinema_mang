import { cn } from "@/lib/cn";

export function FilmMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("text-primary", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8h18M3 16h18" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="6" r="0.7" fill="currentColor" />
      <circle cx="12" cy="6" r="0.7" fill="currentColor" />
      <circle cx="17" cy="6" r="0.7" fill="currentColor" />
      <circle cx="7" cy="18" r="0.7" fill="currentColor" />
      <circle cx="12" cy="18" r="0.7" fill="currentColor" />
      <circle cx="17" cy="18" r="0.7" fill="currentColor" />
    </svg>
  );
}

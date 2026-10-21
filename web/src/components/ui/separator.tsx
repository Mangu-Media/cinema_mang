import { cn } from "@/lib/cn";

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return (
    <div
      role="separator"
      className={cn(vertical ? "w-px self-stretch bg-border" : "h-px w-full bg-border", className)}
    />
  );
}

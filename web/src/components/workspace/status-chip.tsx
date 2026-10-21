import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/cse/format";
import type { JobStatus } from "@/lib/cse/types";

export function StatusChip({ status }: { status: JobStatus | string }) {
  const tone =
    status === "SUCCEEDED" ? "ok" : status === "FAILED" ? "record" : status === "RUNNING" ? "warn" : "muted";
  return <Badge tone={tone}>{statusLabel(status)}</Badge>;
}

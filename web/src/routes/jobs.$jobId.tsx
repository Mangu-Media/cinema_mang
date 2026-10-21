import { createFileRoute } from "@tanstack/react-router";
import { StudioShell } from "@/components/layout/studio-shell";
import { JobWorkspace } from "@/components/workspace/job-workspace";

export const Route = createFileRoute("/jobs/$jobId")({ component: JobPage });

function JobPage() {
  const { jobId } = Route.useParams();
  return (
    <StudioShell>
      <JobWorkspace jobId={jobId} />
    </StudioShell>
  );
}

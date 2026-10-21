import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { surprisePick } from "@/lib/stream/recommend";

export const Route = createFileRoute("/watch/surprise")({ component: SurprisePage });

function SurprisePage() {
  const pick = useMemo(() => surprisePick(), []);
  if (!pick) return <Navigate to="/watch" />;
  return <Navigate to="/watch/play/$titleId" params={{ titleId: pick.id }} />;
}

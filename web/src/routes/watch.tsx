import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/watch")({ component: WatchLayout });

function WatchLayout() {
  return <Outlet />;
}

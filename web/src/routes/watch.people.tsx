import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/watch/people")({ component: PeopleLayout });

function PeopleLayout() {
  return <Outlet />;
}

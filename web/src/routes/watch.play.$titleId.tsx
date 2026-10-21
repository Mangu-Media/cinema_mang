import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AnimaticPlayer } from "@/components/stream/animatic-player";
import { StreamPlayer } from "@/components/stream/player";
import { Button } from "@/components/ui/button";
import { canPlay, getTitle } from "@/lib/stream/catalog";

export const Route = createFileRoute("/watch/play/$titleId")({ component: PlayPage });

function PlayPage() {
  const { titleId } = Route.useParams();
  const title = getTitle(titleId);

  if (!title) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
        <h1 className="font-display text-4xl">No such title.</h1>
        <Button className="mt-5" asChild>
          <Link to="/watch">Watch home</Link>
        </Button>
      </div>
    );
  }

  if (!canPlay(title)) {
    return <Navigate to="/watch/title/$titleId" params={{ titleId: title.id }} />;
  }

  if (title.player === "animatic") return <AnimaticPlayer title={title} />;
  return <StreamPlayer title={title} />;
}

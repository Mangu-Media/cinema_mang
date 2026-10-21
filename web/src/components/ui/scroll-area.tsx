import * as Scroll from "@radix-ui/react-scroll-area";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function ScrollArea({ className, children, ...props }: ComponentProps<typeof Scroll.Root>) {
  return (
    <Scroll.Root className={cn("overflow-hidden", className)} {...props}>
      <Scroll.Viewport className="h-full w-full">{children}</Scroll.Viewport>
      <Scroll.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none select-none bg-transparent p-0.5"
      >
        <Scroll.Thumb className="relative flex-1 rounded-full bg-border-strong" />
      </Scroll.Scrollbar>
    </Scroll.Root>
  );
}

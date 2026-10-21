import { SHOT_TYPE_META } from "@/lib/cse/format";
import { cn } from "@/lib/cn";

function Sprockets() {
  return (
    <>
      <div className="absolute inset-y-0 left-0 z-10 flex w-3 flex-col justify-around py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="mx-auto block h-1.5 w-1.5 rounded-[1px] bg-primary/35" />
        ))}
      </div>
      <div className="absolute inset-y-0 right-0 z-10 flex w-3 flex-col justify-around py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="mx-auto block h-1.5 w-1.5 rounded-[1px] bg-primary/35" />
        ))}
      </div>
    </>
  );
}

function Composition({ aspect }: { aspect: string }) {
  if (aspect === "ecu") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[54%] w-[34%] rounded-full bg-primary/25" />
        <div className="absolute h-[18%] w-[22%] rounded-full bg-primary/15" />
      </div>
    );
  }
  if (aspect === "cu") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[70%] w-[46%] rounded-full bg-primary/20" />
        <div className="absolute top-[28%] h-[14%] w-[22%] rounded-full bg-bg/50" />
      </div>
    );
  }
  if (aspect === "insert") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[42%] w-[52%] rounded-[2px] bg-primary/20" />
        <div className="absolute h-px w-[40%] bg-primary/50" />
      </div>
    );
  }
  if (aspect === "mid") {
    return (
      <div className="absolute inset-0 flex items-end justify-center">
        <div className="mb-[10%] h-[68%] w-[38%] rounded-t-[999px] bg-primary/22" />
        <div className="absolute bottom-[10%] left-[12%] right-[12%] h-px bg-primary/30" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-[14%] bottom-[16%] top-[28%] bg-primary/10" />
      <div className="absolute bottom-[16%] left-[14%] right-[14%] h-[22%] bg-primary/20" />
      <div className="absolute bottom-[16%] left-[18%] h-[36%] w-[16%] bg-primary/30" />
      <div className="absolute bottom-[16%] right-[22%] h-[28%] w-[11%] bg-primary/25" />
      <div className="absolute left-[14%] right-[14%] top-[28%] h-px bg-primary/35" />
    </div>
  );
}

export function StoryboardFrame({
  shotType,
  code,
  promptUrl,
  className,
}: {
  shotType: string;
  code: string;
  promptUrl?: string | null;
  className?: string;
}) {
  const meta = SHOT_TYPE_META[shotType] ?? { short: shotType.slice(0, 3), aspect: "wide" };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-sm)] bg-[#0c0c0e] shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <div className="relative aspect-video">
        {promptUrl ? (
          <img
            src={promptUrl}
            alt=""
            className="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
            crossOrigin="anonymous"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[#101014]" />
            <Composition aspect={meta.aspect} />
            <div className="grain absolute inset-0 opacity-50" />
            <div className="absolute left-5 top-3 h-3 w-3 border-l border-t border-primary/70" />
            <div className="absolute right-5 top-3 h-3 w-3 border-r border-t border-primary/70" />
            <div className="absolute bottom-3 left-5 h-3 w-3 border-b border-l border-primary/70" />
            <div className="absolute bottom-3 right-5 h-3 w-3 border-b border-r border-primary/70" />
            <div className="absolute inset-x-10 top-1/2 h-px bg-primary/15" />
            <div className="absolute inset-y-6 left-1/2 w-px bg-primary/15" />
          </>
        )}
        <Sprockets />
        <div className="absolute left-5 top-2 z-20 font-mono text-[10px] tracking-[0.14em] text-primary">
          {code} · {meta.short}
        </div>
        <div className="absolute bottom-2 right-5 z-20 font-mono text-[10px] text-primary/70">2.39</div>
      </div>
    </div>
  );
}

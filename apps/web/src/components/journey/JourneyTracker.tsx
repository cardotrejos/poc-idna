import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export type JourneyStep = {
  key: string;
  label: string;
  status: "done" | "current" | "todo";
};

export function JourneyTracker({ steps, className }: { steps: JourneyStep[]; className?: string }) {
  return (
    <nav aria-label="Journey progress" className={className}>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.key} className="flex items-center gap-3">
            <StepBadge index={i + 1} status={s.status} />
            <span
              className={cn(
                "text-sm",
                s.status === "current" && "font-medium text-foreground",
                s.status === "todo" && "text-muted-foreground",
                s.status === "done" && "text-foreground",
              )}
              aria-current={s.status === "current" ? "step" : undefined}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepBadge({ index, status }: { index: number; status: JourneyStep["status"] }) {
  if (status === "done") {
    return (
      <span
        className="inline-grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"
        aria-label={`Step ${index} complete`}
      >
        <CheckCircle2 className="size-4" aria-hidden />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span
        className="inline-grid size-7 place-items-center rounded-full border-2 border-primary text-primary"
        aria-label={`Step ${index} current`}
      >
        <span className="text-xs font-semibold">{index}</span>
      </span>
    );
  }
  return (
    <span
      className="inline-grid size-7 place-items-center rounded-full border text-muted-foreground"
      aria-label={`Step ${index} not started`}
    >
      <span className="text-xs font-semibold">{index}</span>
    </span>
  );
}


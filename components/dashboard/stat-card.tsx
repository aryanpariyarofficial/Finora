import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p
            className={cn(
              "mt-1 truncate text-2xl font-bold tabular-nums tracking-tight",
              tone === "positive" && "text-[var(--success)]",
              tone === "negative" && "text-destructive",
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="rounded-lg bg-muted p-2.5">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

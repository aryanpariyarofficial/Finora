import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  phase,
  icon: Icon,
  bullets,
}: {
  title: string;
  description: string;
  phase: string;
  icon: LucideIcon;
  bullets: string[];
}) {
  return (
    <>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <Badge variant="secondary">{phase}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="rounded-2xl bg-muted p-4">
            <Icon className="size-8 text-muted-foreground" />
          </div>
          <div className="max-w-md space-y-1.5">
            <p className="font-semibold">Coming soon</p>
            <p className="text-sm text-muted-foreground">
              The database schema for this module is already in place —
              here&apos;s what will land here:
            </p>
          </div>
          <ul className="grid max-w-md gap-1.5 text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

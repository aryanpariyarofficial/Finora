import { LogoMark } from "@/components/logo";

/** Full-page loader for top-level routes (landing, auth). */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <LogoMark className="size-12 animate-pulse" />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-[oklch(0.63_0.21_355)]" />
      </div>
    </div>
  );
}

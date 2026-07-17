import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="12" fill="oklch(0.28 0.09 280)" />
      <path
        d="M15 38V12h16v5H21v6h9v5h-9v10h-6z"
        fill="white"
      />
      <path
        d="M26 34c4-1 8-4 10-9l-2.6 0.4L38 20l3 6.8-2.4-0.6c-2.2 6-7 9.6-12.6 10.4v-2.6z"
        fill="oklch(0.63 0.21 355)"
      />
      <rect x="27" y="28" width="3" height="6" rx="1" fill="oklch(0.63 0.21 355)" />
      <rect x="31.5" y="25" width="3" height="9" rx="1" fill="oklch(0.63 0.21 355)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-xl font-bold tracking-tight">Finora</span>
    </div>
  );
}

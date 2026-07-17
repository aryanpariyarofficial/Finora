import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { redirect } from "next/navigation";

export const metadata = { title: "Setup" };

export default function SetupPage() {
  if (isSupabaseConfigured()) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-3">
          <Logo />
          <CardTitle>One-time setup required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6">
          <p className="text-muted-foreground">
            Finora needs a Supabase project before it can run. This takes about
            5 minutes:
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Create a free project at{" "}
              <a
                href="https://supabase.com/dashboard"
                className="font-medium text-primary underline underline-offset-4"
              >
                supabase.com/dashboard
              </a>
            </li>
            <li>
              In the project&apos;s <b>SQL Editor</b>, run the contents of{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                supabase/migrations/0001_init.sql
              </code>
            </li>
            <li>
              Copy <b>Project URL</b> and <b>anon key</b> from Settings → API
            </li>
            <li>
              Duplicate{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                .env.example
              </code>{" "}
              as{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                .env.local
              </code>{" "}
              and paste both values
            </li>
            <li>Restart the dev server</li>
          </ol>
          <p className="text-muted-foreground">
            Optional: enable Google login under Authentication → Providers in
            Supabase.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // OAuth signups carry the referral code via cookie (set on /signup).
      const cookieStore = await cookies();
      const ref = cookieStore.get("finora-ref")?.value;
      if (ref) {
        await supabase.rpc("claim_referral", { p_code: ref });
        cookieStore.delete("finora-ref");
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

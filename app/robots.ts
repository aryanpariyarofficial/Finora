import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://finoraypf.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep authenticated app screens out of the index.
        disallow: [
          "/dashboard",
          "/transactions",
          "/accounts",
          "/budgets",
          "/loans",
          "/investments",
          "/reports",
          "/settings",
          "/profile",
          "/admin",
          "/upgrade",
          "/api/",
          "/auth/",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

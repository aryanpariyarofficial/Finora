import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://finoraypf.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  // Public, indexable routes only. App screens sit behind auth.
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/signup`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finora — Your Personal Financial Command Center",
    short_name: "Finora",
    description:
      "Track income, expenses, budgets, loans and investments in one place.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#141633",
    theme_color: "#1e2454",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

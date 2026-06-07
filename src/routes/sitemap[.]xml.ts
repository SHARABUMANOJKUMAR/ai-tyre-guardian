import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://ai-tyre-vision.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/services", changefreq: "monthly", priority: "0.9" },
  { path: "/ai-check", changefreq: "weekly", priority: "0.9" },
  { path: "/tyre-life", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "yearly", priority: "0.7" },
  { path: "/book", changefreq: "monthly", priority: "0.8" },
  { path: "/tools", changefreq: "weekly", priority: "0.9" },
  { path: "/tools/ai-service-advisor", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/fuel-savings-calculator", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/road-trip-safety", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/seasonal-tyre-health", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/service-cost-estimator", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/tyre-life-predictor", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/tyre-mileage-calculator", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/tyre-pressure-calculator", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/tyre-size-calculator", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/wheel-alignment-checker", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/vehicle-running-cost-calculator", changefreq: "monthly", priority: "0.8" },
  { path: "/tools/ai-tyre-brand-recommender", changefreq: "monthly", priority: "0.8" },
  { path: "/tools/ai-tyre-comparison", changefreq: "monthly", priority: "0.8" },
  { path: "/tools/emergency-tyre-assistant", changefreq: "monthly", priority: "0.8" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            `    <lastmod>${today}</lastmod>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

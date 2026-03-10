import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/me/", "/admin/", "/auth/"],
      },
    ],
    sitemap: "https://builderbio.dev/sitemap.xml",
    host: "https://builderbio.dev",
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Catalyst Slate hosts a pre-built directory of files — it does not run a
   * Node server — so MarineLink ships as a fully static export. Every screen is
   * client-rendered against the mock service layer, so nothing here needs SSR.
   */
  output: "export",

  /**
   * Slate matches request paths against uploaded files. `trailingSlash` makes
   * every route emit as `<route>/index.html`, the shape the deep-link handler
   * in `src/components/layout/deep-link-resolver.tsx` is written against.
   */
  trailingSlash: true,

  /**
   * Pinned so the build id is stable across deploys. Next embeds the build id
   * in every RSC payload and hard-navigates to that payload on mismatch; with a
   * per-build id, Slate's year-long HTML cache leaves returning visitors
   * holding a document whose payloads 404 — it presents as "every link is dead".
   */
  generateBuildId: () => "marinelink",

  images: {
    // No Next image optimiser exists in a static export.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },

  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "framer-motion"],
  },
};

export default nextConfig;

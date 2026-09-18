import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MarineLink",
    short_name: "MarineLink",
    description:
      "Role-based marine equipment relationship and service platform for Marine Travelift, its dealers, and their customers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#10151f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

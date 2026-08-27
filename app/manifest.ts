import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TikTok Manager",
    short_name: "Manager",
    description: "Three channels, one calendar.",
    start_url: "/",
    display: "standalone",
    background_color: "#101318",
    theme_color: "#101318",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

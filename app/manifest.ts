import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TalkBanana",
    short_name: "TalkBanana",
    description: "Tradução de voz em tempo real com IA",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0800",
    theme_color: "#0a0800",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

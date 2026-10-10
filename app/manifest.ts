import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
    return{
        name: "habit tracker",
        short_name: "habits",
        description: "A simple daily habit tracker.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png"
            }
        ]
    }
}
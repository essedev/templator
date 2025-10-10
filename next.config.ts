import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Unoptimized images required for Cloudflare Workers
    // Cloudflare Workers don't support Next.js automatic image optimization
    // Use Cloudflare Images or external CDN for production optimization
    unoptimized: true,
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

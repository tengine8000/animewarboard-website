import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.wikia.com" },
      { protocol: "https", hostname: "**.fandom.com" },
      { protocol: "https", hostname: "static.wikia.nocookie.net" },
      { protocol: "https", hostname: "**.wikimedia.org" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800,
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  allowedDevOrigins: ["172.20.10.3"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.animewarboard.com" }],
        destination: "https://animewarboard.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      ...(isProd ? [{
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      }] : []),
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

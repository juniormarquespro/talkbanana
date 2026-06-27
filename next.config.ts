import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.YOURDOMAIN.com" }],
        destination: "https://YOURDOMAIN.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

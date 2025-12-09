import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Allow requests from the local network IP (WSL/LAN) to silence CORS warnings
  // Note: For Next.js 16+, check if this needs to be top-level or experimental.
  // Putting it top-level based on recent standard config patterns.
  // experimental: {
  //      allowedDevOrigins: ['172.24.0.1:3000', 'localhost:3000'],
  // }
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix lockfile warning by explicitly setting workspace root
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript strict checking during production builds
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: '/lander',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

export default nextConfig;

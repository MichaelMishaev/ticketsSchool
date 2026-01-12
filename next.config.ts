import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable standalone output for minimal Docker images (reduces size by 80%)
  // ONLY use in production builds - causes dev server issues
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Fix lockfile warning by explicitly setting workspace root
  outputFileTracingRoot: process.env.NODE_ENV === 'production' ? path.join(__dirname) : undefined,
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

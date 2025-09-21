import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

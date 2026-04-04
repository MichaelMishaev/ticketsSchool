import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling packages that use worker threads or native paths
  // pino-pretty uses thread-stream which spawns workers; bundling breaks the worker file path
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],

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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net; frame-ancestors 'none';",
          },
        ],
      },
    ]
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

export default nextConfig

module.exports = {
  ci: {
    collect: {
      // Port 9000 is where Next.js dev/prod server runs (configured in package.json)
      url: ['http://localhost:9000'],
      numberOfRuns: 3,
      settings: {
        // Test on mobile and desktop
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance thresholds
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],

        // Accessibility - strict
        'categories:accessibility': ['error', { minScore: 0.9 }],

        // Best practices
        'categories:best-practices': ['warn', { minScore: 0.85 }],

        // SEO
        'categories:seo': ['warn', { minScore: 0.8 }],

        // PWA - relaxed (not a PWA yet)
        'categories:pwa': 'off',

        // Hebrew RTL specific checks
        'meta-viewport': 'error',
        'viewport': 'error',
        'content-width': 'error',

        // Mobile-first design
        'tap-targets': ['warn', { minScore: 0.8 }],
        'font-size': ['warn', { minScore: 0.8 }],

        // Performance budget (warn only, don't fail)
        'uses-long-cache-ttl': 'warn',
        'uses-optimized-images': 'warn',
        'modern-image-formats': 'warn',
        'uses-text-compression': 'warn',
        'uses-responsive-images': 'warn',

        // Security
        'is-on-https': 'off', // localhost is HTTP
      },
    },
    upload: {
      target: 'temporary-public-storage', // Free, temporary public storage
    },
  },
};

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:9000/',
        'http://localhost:9000/admin/login',
      ],
      numberOfRuns: 3,
      // Build first, then start the production server.
      // startServerReadyTimeout allows time for npm run build to complete.
      startServerCommand: 'npm run build && npm run start:prod',
      startServerReadyPattern: 'ready',
      startServerReadyTimeout: 120000,
    },
    assert: {
      assertions: {
        'categories:performance':      ['warn',  { minScore: 0.7 }],
        'first-contentful-paint':      ['warn',  { maxNumericValue: 1800 }],
        'largest-contentful-paint':    ['warn',  { maxNumericValue: 2500 }],
        'cumulative-layout-shift':     ['error', { maxNumericValue: 0.1 }],
        'interactive':                 ['warn',  { maxNumericValue: 3800 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}

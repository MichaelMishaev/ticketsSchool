import http from 'k6/http'
import { check, sleep } from 'k6'
import { BASE_URL, ADMIN_COOKIE } from '../config/environments.js'
import { dashboardLoadThresholds } from '../config/thresholds.js'

export const options = {
  thresholds: dashboardLoadThresholds,
  stages: [
    { duration: '20s', target: 100 },
    { duration: '2m',  target: 100 },
    { duration: '20s', target: 0   },
  ],
}

export default function () {
  const headers = ADMIN_COOKIE ? { Cookie: `admin_session=${ADMIN_COOKIE}` } : {}

  const endpoints = [
    '/api/dashboard/stats',
    '/api/dashboard/occupancy',
    '/api/dashboard/registrations',
    '/api/dashboard/waitlist',
    '/api/dashboard/active-events',
  ]

  for (const endpoint of endpoints) {
    const res = http.get(`${BASE_URL}${endpoint}`, { headers })
    check(res, { [`${endpoint} no 500`]: (r) => r.status < 500 })
    sleep(0.1)
  }
  sleep(1)
}

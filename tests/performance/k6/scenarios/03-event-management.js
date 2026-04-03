import http from 'k6/http'
import { check, sleep } from 'k6'
import { BASE_URL, ADMIN_COOKIE } from '../config/environments.js'
import { eventManagementThresholds } from '../config/thresholds.js'

export const options = {
  thresholds: eventManagementThresholds,
  stages: [
    { duration: '15s', target: 50 },
    { duration: '2m',  target: 50 },
    { duration: '15s', target: 0  },
  ],
}

export default function () {
  const headers = ADMIN_COOKIE
    ? { Cookie: `admin_session=${ADMIN_COOKIE}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }

  const listRes = http.get(`${BASE_URL}/api/events`, { headers })
  check(listRes, { 'events list no 500': (r) => r.status < 500 })

  let eventId = null
  if (listRes.status === 200) {
    try {
      const body = JSON.parse(listRes.body)
      const events = Array.isArray(body) ? body : body.events
      if (events?.length > 0) eventId = events[0].id
    } catch { /* ignore */ }
  }
  sleep(0.3)

  if (eventId) {
    const detailRes = http.get(`${BASE_URL}/api/events/${eventId}`, { headers })
    check(detailRes, { 'event detail no 500': (r) => r.status < 500 })
  }
  sleep(2)
}

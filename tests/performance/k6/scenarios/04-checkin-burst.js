import http from 'k6/http'
import { check, sleep } from 'k6'
import { BASE_URL, CHECKIN_EVENT_ID, CHECKIN_TOKEN, CHECKIN_REGISTRATION_ID } from '../config/environments.js'
import { checkinBurstThresholds } from '../config/thresholds.js'

export const options = {
  thresholds: checkinBurstThresholds,
  stages: [
    { duration: '10s', target: 500 },
    { duration: '30s', target: 500 },
    { duration: '10s', target: 0   },
  ],
}

export default function () {
  if (!CHECKIN_EVENT_ID || !CHECKIN_TOKEN || !CHECKIN_REGISTRATION_ID) {
    sleep(1)
    return
  }

  const checkInRes = http.post(
    `${BASE_URL}/api/check-in/${CHECKIN_EVENT_ID}/${CHECKIN_TOKEN}/${CHECKIN_REGISTRATION_ID}`,
    null,
    { headers: { 'Content-Type': 'application/json' } }
  )
  check(checkInRes, {
    'check-in no 500': (r) => r.status < 500,
    'check-in responds': (r) => r.status === 200 || r.status === 409,
  })
  sleep(0.1)

  const statsRes = http.get(`${BASE_URL}/api/check-in/${CHECKIN_EVENT_ID}/${CHECKIN_TOKEN}/stats`)
  check(statsRes, { 'stats no 500': (r) => r.status < 500 })
  sleep(0.5)
}

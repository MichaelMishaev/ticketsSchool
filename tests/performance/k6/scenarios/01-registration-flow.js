import http from 'k6/http'
import { check, sleep } from 'k6'
import { BASE_URL, SCHOOL_SLUG, EVENT_SLUG } from '../config/environments.js'
import { registrationFlowThresholds } from '../config/thresholds.js'

export const options = {
  thresholds: registrationFlowThresholds,
  stages: [
    { duration: '30s', target: 200 },
    { duration: '2m',  target: 200 },
    { duration: '30s', target: 0   },
  ],
}

export default function () {
  const schoolRes = http.get(`${BASE_URL}/api/p/${SCHOOL_SLUG}`)
  check(schoolRes, { 'school list 200': (r) => r.status === 200 })
  sleep(0.5)

  const eventRes = http.get(`${BASE_URL}/api/p/${SCHOOL_SLUG}/${EVENT_SLUG}`)
  check(eventRes, {
    'event detail 200': (r) => r.status === 200,
    'event has capacity': (r) => {
      try { return JSON.parse(r.body).event?.capacity !== undefined } catch { return false }
    },
  })
  sleep(1)

  const payload = JSON.stringify({
    data: {
      fullName: `Load Test ${__VU}-${__ITER}`,
      phone: `050${String(1000000 + Math.floor(Math.random() * 8999999))}`,
    },
    spotsCount: 1,
  })

  const regRes = http.post(
    `${BASE_URL}/api/p/${SCHOOL_SLUG}/${EVENT_SLUG}/register`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  )
  check(regRes, {
    'registration no 500': (r) => r.status < 500,
    'registration ok':     (r) => r.status === 200 || r.status === 201,
  })
  sleep(2)
}

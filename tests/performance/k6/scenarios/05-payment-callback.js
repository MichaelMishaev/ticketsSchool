import http from 'k6/http'
import { check, sleep } from 'k6'
import { hmac } from 'k6/crypto'
import { BASE_URL, YAADPAY_API_SECRET, YAADPAY_MASOF } from '../config/environments.js'
import { paymentCallbackThresholds } from '../config/thresholds.js'

export const options = {
  thresholds: paymentCallbackThresholds,
  stages: [
    { duration: '10s', target: 50 },
    { duration: '1m',  target: 50 },
    { duration: '10s', target: 0  },
  ],
}

export default function () {
  if (!YAADPAY_API_SECRET) {
    sleep(1)
    return
  }

  const order  = `perf-${__VU}-${__ITER}-${Date.now()}`
  const amount = '100'
  const ccode  = '0'

  // Signature verified from lib/yaadpay.ts: HMAC-SHA256(Order + Amount + CCode) — no separator
  const dataToSign = `${order}${amount}${ccode}`
  const signature  = hmac('sha256', YAADPAY_API_SECRET, dataToSign, 'hex')

  const payload = JSON.stringify({
    Order: order,
    Masof: YAADPAY_MASOF,
    Amount: amount,
    CCode: ccode,
    Id: `txn-${order}`,
    Currency: '1',
    signature,
  })

  const res = http.post(
    `${BASE_URL}/api/payment/callback`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  )

  check(res, {
    'callback no 500': (r) => r.status < 500,
    'callback responds': (r) => [200, 400, 404].includes(r.status),
  })
  sleep(1)
}

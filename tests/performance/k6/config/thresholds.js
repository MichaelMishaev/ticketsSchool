export const registrationFlowThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.001'],
}

export const dashboardLoadThresholds = {
  http_req_duration: ['p(95)<300', 'p(99)<600'],
  http_req_failed: ['rate<0.001'],
}

export const eventManagementThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.001'],
}

export const checkinBurstThresholds = {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  http_req_failed: ['rate<0.01'],
}

export const paymentCallbackThresholds = {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  http_req_failed: ['rate<0.001'],
}

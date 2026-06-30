import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, defaultHeaders } from "./config.js";

export const options = {
  // Simulates 50 users hitting the endpoint continuously for 30 seconds
  stages: [
    { duration: "10s", target: 25 }, // Ramp up to 25 concurrent users (well past your pool limit of 10)
    { duration: "30s", target: 25 }, // Hold at 25 users
    { duration: "10s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // Expect under 1% failures
  },
};

export default function () {
  const url = `${BASE_URL}/auth/register`;

  // Generate a completely unique email per request using a timestamp and random number
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const payload = JSON.stringify({
    email: `test-${uniqueId}@rivet.dev`,
    firstName: "Test",
    lastName: "User",
    password: "SuperSecurePassword123!",
    orgName: `Org-${uniqueId}`,
  });

  const params = {
    headers: {
      ...defaultHeaders(),
    },
  };

  const res = http.post(url, payload, params);

  // Verify that the server is responding with a 201 Created status code
  check(res, {
    "status is 201": (r) => r.status === 201,
    "transaction time under 400ms": (r) => r.timings.duration < 400,
    "response has requestId": (r) =>
      JSON.parse(r.body)?.requestId !== undefined,
  });

  sleep(0.1); // Short pause between requests per virtual user
}

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, defaultHeaders } from "./config";

export const options = {
  // Simulates 50 users hitting the endpoint continuously for 30 seconds
  stages: [
    { duration: "5s", target: 50 }, // Ramp up from 0 to 50 users
    { duration: "20s", target: 50 }, // Stay at 50 users
    { duration: "5s", target: 0 }, // Ramp down to 0
  ],
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

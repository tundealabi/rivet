// load-tests/config.js
export const BASE_URL = __ENV.K6_BASE_URL || "http://localhost:8090/api/v1";

export function defaultHeaders() {
  return { "Content-Type": "application/json" };
}

export function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// load-tests/config.js
// const DEFAULT_BASE_URL = "http://localhost:8090/api/v1";
const DEFAULT_BASE_URL = "https://rivet-li0p.onrender.com/api/v1";
export const BASE_URL = __ENV.K6_BASE_URL || DEFAULT_BASE_URL;

export function defaultHeaders() {
  return { "Content-Type": "application/json" };
}

export function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

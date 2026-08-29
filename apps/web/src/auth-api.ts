const REGISTER_URL = "https://rivet-n8w6.onrender.com/api/v1/auth/register";
const LOGIN_URL = "https://rivet-n8w6.onrender.com/api/v1/auth/login";
const LOGOUT_URL = "https://rivet-n8w6.onrender.com/api/v1/auth/logout";
const REFRESH_URL = "https://rivet-n8w6.onrender.com/api/v1/auth/refresh";

/**
 * Dual-token auth (ADR-0001):
 * - Access JWT: short-lived, stored here, sent as `Authorization: Bearer`.
 * - Refresh token: httpOnly cookie set by the API. Never read or stored in JS.
 */
const AUTH_STORAGE_KEYS = {
  accessToken: "rivet.accessToken",
  user: "rivet.user",
} as const;

const LEGACY_REFRESH_TOKEN_KEY = "rivet.refreshToken";

export interface RegisterUserInput {
  email: string;
  firstName: string;
  lastName: string;
  orgName: string;
  password: string;
}

interface RegisterUserResponse {
  email: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  authTokens: {
    accessToken: string;
  };
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export type AuthTokens = LoginUserResponse["authTokens"];
export type AuthUser = LoginUserResponse["user"];

export interface RefreshAuthResponse {
  authTokens: AuthTokens;
}

function dropLegacyRefreshToken() {
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

export function saveAuthSession(
  authTokens: AuthTokens,
  user: LoginUserResponse["user"]
) {
  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, authTokens.accessToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
  dropLegacyRefreshToken();
}

export function updateStoredAuthTokens(authTokens: AuthTokens) {
  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, authTokens.accessToken);
  dropLegacyRefreshToken();
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  dropLegacyRefreshToken();
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.user);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as AuthUser;
    if (!user?.email || !user.firstName) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Presence of an access token means we have a local session to try.
 * Expiry is not logout — the httpOnly refresh cookie is the session.
 */
export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem(AUTH_STORAGE_KEYS.accessToken));
}

interface ApiError {
  message: string;
  fields?: Record<string, { message: string }[]>;
}

interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export class ApiRequestError extends Error {
  readonly fields?: Record<string, { message: string }[]>;

  constructor(message: string, fields?: Record<string, { message: string }[]>) {
    super(message);
    this.name = "ApiRequestError";
    this.fields = fields;
  }
}

export const SESSION_EXPIRED_MESSAGE = "Session expired";

export const SESSION_EXPIRED_EVENT = "rivet:session-expired";

export function isSessionExpiredError(error: unknown): boolean {
  return error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE;
}

function emitSessionExpired(): void {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

function failSessionExpired(): never {
  clearAuthSession();
  emitSessionExpired();
  throw new ApiRequestError(SESSION_EXPIRED_MESSAGE);
}

let refreshPromise: Promise<AuthTokens> | null = null;

export async function refreshAuthTokens(): Promise<AuthTokens> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
    });

    let payload: ApiResponse<RefreshAuthResponse>;

    try {
      payload = (await response.json()) as ApiResponse<RefreshAuthResponse>;
    } catch {
      throw new ApiRequestError(
        response.ok
          ? "The server returned an invalid response"
          : "Unable to refresh session"
      );
    }

    if (!response.ok || payload.error) {
      throw new ApiRequestError(
        payload.error?.message ?? "Unable to refresh session"
      );
    }

    const authTokens = payload.data?.authTokens;

    if (!authTokens?.accessToken) {
      throw new ApiRequestError("The server returned an invalid response");
    }

    updateStoredAuthTokens(authTokens);
    return authTokens;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Fetch wrapper that attaches the access token and retries once after
 * refreshing when the server responds with 401.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await fetch(input, { ...init, headers });

  if (response.status !== 401) {
    return response;
  }

  try {
    const authTokens = await refreshAuthTokens();
    headers.set("Authorization", `Bearer ${authTokens.accessToken}`);
    response = await fetch(input, { ...init, headers });
  } catch {
    failSessionExpired();
  }

  if (response.status === 401) {
    failSessionExpired();
  }

  return response;
}

/**
 * Revokes the server session via the refresh cookie, then clears local storage.
 * Always attempted: logout is cookie-authenticated, not Bearer-authenticated.
 * Local logout still succeeds if the request fails (offline, already expired).
 */
export async function logoutUser(): Promise<void> {
  try {
    await fetch(LOGOUT_URL, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore network errors — the local session is cleared regardless.
  } finally {
    clearAuthSession();
  }
}

export async function registerUser(
  input: RegisterUserInput
): Promise<RegisterUserResponse> {
  const response = await fetch(REGISTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: ApiResponse<RegisterUserResponse>;

  try {
    payload = (await response.json()) as ApiResponse<RegisterUserResponse>;
  } catch {
    throw new ApiRequestError(
      response.ok
        ? "The server returned an invalid response"
        : "Unable to create your account"
    );
  }

  if (!response.ok || payload.error) {
    const error = payload.error;
    throw new ApiRequestError(
      error?.message ?? "Unable to create your account",
      error?.fields
    );
  }

  if (!payload.data) {
    throw new ApiRequestError("The server returned an invalid response");
  }

  return payload.data;
}

export async function loginUser(
  input: LoginUserInput
): Promise<LoginUserResponse> {
  const response = await fetch(LOGIN_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: ApiResponse<LoginUserResponse>;

  try {
    payload = (await response.json()) as ApiResponse<LoginUserResponse>;
  } catch {
    throw new ApiRequestError(
      response.ok
        ? "The server returned an invalid response"
        : "Unable to log in"
    );
  }

  if (!response.ok || payload.error) {
    throw new ApiRequestError(
      payload.error?.message ?? "Unable to log in",
      payload.error?.fields
    );
  }

  if (!payload.data?.authTokens?.accessToken || !payload.data.user) {
    throw new ApiRequestError("The server returned an invalid response");
  }

  return payload.data;
}

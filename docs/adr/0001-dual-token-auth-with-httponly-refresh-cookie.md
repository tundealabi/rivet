# ADR-0001: Dual-token auth with httpOnly refresh cookie

## Status

Accepted

## Date

2026-08-02

## Context

Rivet is a SPA (Vite/React on Vercel) talking to a NestJS API (Render). They run on **separate registrable domains** (`*.vercel.app` and `*.onrender.com`), so browser requests are cross-site.

We need persistent login without keeping long-lived secrets in JavaScript-accessible storage, and stateless API authentication for protected routes.

## Decision

This ADR defines the **API contract**. The NestJS API sets and reads the refresh `httpOnly` cookie, and wire schemas omit `refreshToken` from HTTP JSON. Migrating the web SPA onto that contract is tracked separately (see Follow-ups); until then a client may still hold refresh in JS and the XSS claim below applies only to cookie-compliant clients.

### Token model

| Token             | Lifetime                        | Client (target)                                         | Server                                                                                    |
| ----------------- | ------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Access JWT**    | Short (~15 min, env-configured) | Response body → client storage (localStorage)           | Verified via Bearer header + shared secret                                                |
| **Refresh token** | Long (~7 days, env-configured)  | `httpOnly` **cookie only** — never in JSON, never in JS | Opaque token; HMAC-SHA256 (`SECURITY_HMAC_PEPPER`) in `refresh_tokens`; tied to `Session` |

Access JWT claims: `sub` (user id) and `sid` (session id) only. Tenant context (org, role) is handled outside this token — see `[ARCHITECTURE.md](../ARCHITECTURE.md)` tenant isolation.

### Endpoints

| Route                      | Auth mechanism                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login`         | Public. Returns access token in body; sets refresh cookie.                                                      |
| `POST /auth/register`      | Public. Creates user + org; returns access token in body; sets refresh cookie (same as login).                  |
| `POST /auth/refresh`       | Public. Reads refresh cookie; rotates refresh token; returns new access token in body; sets new refresh cookie. |
| `POST /auth/logout`        | Refresh cookie. Revokes session and refresh token row; clears cookie.                                           |
| All other protected routes | `Authorization: Bearer <access JWT>` (global `AuthUserJwtGuard`; `@ApiPublic()` to opt out)                     |

Refresh token is **rotated** on every refresh. Reuse of a revoked refresh token revokes the entire session.

### Cookie attributes (production)

Cross-site deployment requires:

- `httpOnly: true`
- `Secure: true`
- `SameSite=None`
- `path: /api/v1/auth` (limit cookie to auth routes)

Local development uses `SameSite=Lax` and `Secure=false` (localhost ports are same-site). If API and web later share a registrable domain, consider `SameSite=Strict` then.

### CORS

API enables CORS with `credentials: true` and an explicit origin allowlist from `APP_CORS_ORIGINS`. Cookie-compliant clients call login, refresh, and logout with `credentials: 'include'`.

### Accepted XSS tradeoff

The access token lives in client-accessible storage (localStorage). XSS can steal it until expiry. **Short access TTL** is the primary mitigation. Browser-side encryption (e.g. secure-ls) is obfuscation only — it does not protect against XSS because the key lives in the same JS context.

For clients that use the cookie-only refresh path, the refresh token is **not** exposed to JS (`httpOnly`), so XSS cannot exfiltrate long-lived session credentials. A client that still stores refresh in JS loses that property until it migrates.

## Alternatives considered

| Option                              | Why not                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Both tokens in localStorage         | Refresh token stealable via XSS → long-lived compromise                    |
| Session cookie only (no JWT)        | Poor fit for separate API + SPA; harder Bearer contract for future clients |
| BFF holding both tokens server-side | Stronger XSS posture but adds infra; deferred                              |

## Consequences

### Positive

- API never returns refresh on the wire; cookie-compliant clients keep refresh out of JS
- Token rotation and session revoke support logout and theft detection
- Access JWT stays minimal and identity-focused

### Negative

- Access token remains XSS-exposed for its TTL if stored in localStorage
- Cross-origin cookie setup is strict: CORS credentials, `SameSite=None`, `Secure`, explicit origins
- Access JWT cannot be revoked instantly without a blocklist; session invalidation is enforced on refresh
- Until the web app migrates, it may still store refresh in localStorage and ignore the cookie path

### Follow-ups

- [ ] Web client (separate from API): `credentials: 'include'` on auth routes; access token in localStorage only; never store refresh in JS

## References

- `[docs/ARCHITECTURE.md](../ARCHITECTURE.md)` — Authentication
- `[apps/api/src/api/auth/auth.service.ts](../../apps/api/src/api/auth/auth.service.ts)` — cookie options, refresh rotation
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

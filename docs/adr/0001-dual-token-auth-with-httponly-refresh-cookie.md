# ADR-0001: Dual-token auth with httpOnly refresh cookie

## Status

Accepted

## Date

2026-08-02

## Context

Rivet is a SPA (Vite/React on Vercel) talking to a NestJS API (Render). They run on **separate registrable domains** (`*.vercel.app` and `*.onrender.com`), so browser requests are cross-site.

We need persistent login without keeping long-lived secrets in JavaScript-accessible storage, and stateless API authentication for protected routes.

## Decision

### Token model

| Token             | Lifetime                        | Client                                                  | Server                                                        |
| ----------------- | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| **Access JWT**    | Short (~15 min, env-configured) | Response body → client storage (localStorage)           | Verified via Bearer header + shared secret                    |
| **Refresh token** | Long (~7 days, env-configured)  | `httpOnly` **cookie only** — never in JSON, never in JS | Opaque token; SHA hash in `refresh_tokens`; tied to `Session` |

Access JWT claims: `sub` (user id) and `sid` (session id) only. Tenant context (org, role) is handled outside this token — see `[ARCHITECTURE.md](../ARCHITECTURE.md)` tenant isolation.

### Endpoints

| Route                      | Auth mechanism                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login`         | Public. Returns access token in body; sets refresh cookie.                                                      |
| `POST /auth/refresh`       | Public. Reads refresh cookie; rotates refresh token; returns new access token in body; sets new refresh cookie. |
| `POST /auth/logout`        | Refresh cookie. Revokes session; clears cookie.                                                                 |
| All other protected routes | `Authorization: Bearer <access JWT>`                                                                            |

Refresh token is **rotated** on every refresh. Reuse of a revoked refresh token revokes the entire session.

### Cookie attributes (production)

Cross-site deployment requires:

- `httpOnly: true`
- `Secure: true`
- `SameSite=None`
- `path: /api/v1/auth` (limit cookie to auth routes)

Local development uses `SameSite=Lax` and `Secure=false` (localhost ports are same-site).

### CORS

API enables CORS with `credentials: true` and an explicit allowlist of frontend origins (Vercel URLs). Clients call login, refresh, and logout with `credentials: 'include'`.

### Accepted XSS tradeoff

The access token lives in client-accessible storage (localStorage). XSS can steal it until expiry. **Short access TTL** is the primary mitigation. Browser-side encryption (e.g. secure-ls) is obfuscation only — it does not protect against XSS because the key lives in the same JS context.

The refresh token is **not** exposed to JS (`httpOnly`), so XSS cannot exfiltrate long-lived session credentials.

## Alternatives considered

| Option                              | Why not                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Both tokens in localStorage         | Refresh token stealable via XSS → long-lived compromise                    |
| Session cookie only (no JWT)        | Poor fit for separate API + SPA; harder Bearer contract for future clients |
| Org/role claims in access JWT       | Couples authentication to tenant context; see tenant isolation docs        |
| BFF holding both tokens server-side | Stronger XSS posture but adds infra; deferred                              |
| `SameSite=Strict` in production     | Breaks credentialed refresh from Vercel → Render (cross-site fetch)        |
| OAuth / social login                | Out of scope for v1                                                        |

## Consequences

### Positive

- Refresh token never readable by application JavaScript
- Token rotation and session revoke support logout and theft detection
- Access JWT stays minimal and identity-focused

### Negative

- Access token remains XSS-exposed for its TTL if stored in localStorage
- Cross-origin cookie setup is strict: CORS credentials, `SameSite=None`, `Secure`, explicit origins
- Access JWT cannot be revoked instantly without a blocklist; session invalidation is enforced on refresh

### Follow-ups

- [ ] Implement web client: `credentials: 'include'` on auth routes; access token in localStorage only; never store refresh in JS
- [ ] Revisit `SameSite=Strict` if API and web move to the same registrable domain (e.g. `app.rivet.com` / `api.rivet.com`)

## References

- `[docs/ARCHITECTURE.md](../ARCHITECTURE.md)` — Authentication
- `[apps/api/src/api/auth/auth.service.ts](../../apps/api/src/api/auth/auth.service.ts)` — cookie options, refresh rotation
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

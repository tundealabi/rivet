// ------------------------------
// Sessions
// ------------------------------

export interface CreateSessionInput {
  userId: string;
  ipAddress: string;
  userAgent: string;
}

export interface UpdateSessionInput {
  ipAddress: string;
}

// ------------------------------
// Tokens
// ------------------------------

export interface CreateRefreshTokenInput {
  sessionId: string;
}

export interface GenerateAccessTokenInput {
  sessionId: string;
  userId: string;
}

export interface VerifyAccessTokenInput {
  token: string;
}

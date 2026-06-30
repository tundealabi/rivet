export interface GenerateAccessTokenInput {
  userId: string;
}

export interface GenerateRefreshTokenInput {
  userId: string;
}

export interface VerifyAccessTokenInput {
  token: string;
}

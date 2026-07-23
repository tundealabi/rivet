import type { UserProfile } from "./settings-types";

export const MOCK_USER_PROFILE: UserProfile = {
  id: "user-1",
  email: "ada@acme.io",
  emailVerified: true,
  fullName: "Ada Lovelace",
  avatarUrl: null,
  locale: {
    language: "en-US",
    timezone: "America/New_York",
    dateFormat: "mdy",
  },
};

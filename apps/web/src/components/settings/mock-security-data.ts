import type { SecuritySettings } from "./settings-types";

const now = Date.now();

export const MOCK_SECURITY_SETTINGS: SecuritySettings = {
  mfaEnabled: false,
  sessions: [
    {
      id: "session-current",
      deviceLabel: "Chrome on macOS",
      location: "San Francisco, CA",
      lastActiveAt: new Date(now - 2 * 60 * 1000),
      isCurrent: true,
    },
    {
      id: "session-iphone",
      deviceLabel: "Safari on iPhone",
      location: "San Francisco, CA",
      lastActiveAt: new Date(now - 2 * 60 * 60 * 1000),
      isCurrent: false,
    },
    {
      id: "session-windows",
      deviceLabel: "Firefox on Windows",
      location: "New York, NY",
      lastActiveAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      isCurrent: false,
    },
  ],
  activity: [
    {
      id: "activity-1",
      type: "sign_in",
      description: "Signed in from Chrome on macOS",
      occurredAt: new Date(now - 2 * 60 * 60 * 1000),
    },
    {
      id: "activity-2",
      type: "password_changed",
      description: "Password changed",
      occurredAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "activity-3",
      type: "sign_in",
      description: "Signed in from Safari on iPhone",
      occurredAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "activity-4",
      type: "session_revoked",
      description: "Signed out of Firefox on Windows",
      occurredAt: new Date(now - 14 * 24 * 60 * 60 * 1000),
    },
  ],
};

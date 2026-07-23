import type {
  OrgGeneralSettings,
  OrgNotificationSettings,
} from "./settings-types";

export const MOCK_ORG_SLUG = "acme-inc";

export const TAKEN_ORG_SLUGS = new Set([
  "rivet",
  "admin",
  "api",
  "app",
  "www",
  "taken",
  "acme",
]);

export const MOCK_ORG_GENERAL_SETTINGS: OrgGeneralSettings = {
  id: "org_acme",
  name: "Acme Inc.",
  slug: MOCK_ORG_SLUG,
  logoUrl: null,
  timezone: "America/New_York",
  dateFormat: "mdy",
};

export const MOCK_ORG_NOTIFICATION_SETTINGS: OrgNotificationSettings = {
  id: "org_acme",
  emailNotificationsEnabled: true,
  defaultEvents: {
    issueAssigned: true,
    mentionedInComment: true,
    issueCreatedUpdated: true,
    watchedIssueStatusChanged: true,
    weeklyDigest: false,
  },
  senderName: "Acme Inc. on Rivet",
  replyToEmail: "notifications@acme.io",
};

import type { NotificationPreferences } from "./settings-types";

export const MOCK_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  events: {
    issueAssigned: true,
    mentionedInComment: true,
    issueCreatedUpdated: true,
    watchedIssueStatusChanged: true,
    roleChanged: true,
    orgInvite: false,
  },
  frequency: "instant",
  notificationEmail: null,
};

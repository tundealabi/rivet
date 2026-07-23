import type { OrganizationRole } from "@rivet/shared";

export type DateFormatStyle = "mdy" | "dmy" | "iso";

export interface OrgGeneralSettings {
  id: string;

  name: string;

  slug: string;

  logoUrl: string | null;

  timezone: string;

  dateFormat: DateFormatStyle;
}

export type SlugAvailability = "available" | "taken" | "invalid";

export const DATE_FORMAT_OPTIONS: {
  value: DateFormatStyle;

  label: string;

  example: string;
}[] = [
  { value: "mdy", label: "Mar 15, 2026", example: "Mar 15, 2026" },

  { value: "dmy", label: "15 Mar 2026", example: "15 Mar 2026" },

  { value: "iso", label: "2026-03-15", example: "2026-03-15" },
];

export interface UserLocalePreferences {
  language: string;

  timezone: string;

  dateFormat: DateFormatStyle;
}

export interface UserProfile {
  id: string;

  email: string;

  emailVerified: boolean;

  fullName: string;

  avatarUrl: string | null;

  locale: UserLocalePreferences;
}

export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "en-US", label: "English (US)" },

  { value: "en-GB", label: "English (UK)" },

  { value: "es", label: "Español" },

  { value: "fr", label: "Français" },

  { value: "de", label: "Deutsch" },

  { value: "ja", label: "日本語" },
];

export interface OrgDefaultNotificationEvents {
  issueAssigned: boolean;
  mentionedInComment: boolean;
  issueCreatedUpdated: boolean;
  watchedIssueStatusChanged: boolean;
  weeklyDigest: boolean;
}

export interface OrgNotificationSettings {
  id: string;
  emailNotificationsEnabled: boolean;
  defaultEvents: OrgDefaultNotificationEvents;
  senderName: string;
  replyToEmail: string | null;
}

export interface NotificationPreferences {
  events: UserNotificationEvents;
  frequency: NotificationEmailFrequency;
  /** null = use login email */
  notificationEmail: string | null;
}

export type NotificationEmailFrequency =
  "instant" | "daily" | "weekly" | "never";

export interface UserNotificationEvents {
  issueAssigned: boolean;
  mentionedInComment: boolean;
  issueCreatedUpdated: boolean;
  watchedIssueStatusChanged: boolean;
  roleChanged: boolean;
  orgInvite: boolean;
}

export interface AccountNotificationSettings {
  orgEmailNotificationsEnabled: boolean;
  loginEmail: string;
  preferences: NotificationPreferences;
}

export const NOTIFICATION_FREQUENCY_OPTIONS: {
  value: NotificationEmailFrequency;
  label: string;
  description: string;
}[] = [
  { value: "instant", label: "Instantly", description: "Email per event" },
  { value: "daily", label: "Daily digest", description: "Once per day" },
  { value: "weekly", label: "Weekly digest", description: "Once per week" },
  { value: "never", label: "Never", description: "No notification emails" },
];

export interface SettingsPageData {
  profile: UserProfile;

  notifications: NotificationPreferences;
}

export interface UserOrgMembership {
  orgId: string;
  orgName: string;
  role: OrganizationRole;
}

export interface AccountDangerContext {
  memberships: UserOrgMembership[];
}

export type OrgDeletionRedirect =
  | { type: "org"; orgId: string; orgName: string }
  | { type: "create-org" }
  | { type: "login" };

export interface DeleteOrganizationResult {
  jobId: string;
  redirect: OrgDeletionRedirect;
}

export interface ActiveSession {
  id: string;
  deviceLabel: string;
  location: string;
  lastActiveAt: Date;
  isCurrent: boolean;
}

export type SecurityActivityType =
  "sign_in" | "password_changed" | "email_changed" | "session_revoked";

export interface SecurityActivityEvent {
  id: string;
  type: SecurityActivityType;
  description: string;
  occurredAt: Date;
}

export interface SecuritySettings {
  sessions: ActiveSession[];
  mfaEnabled: boolean;
  activity: SecurityActivityEvent[];
}

export type SettingsSectionId =
  | "organization"
  | "organizationNotifications"
  | "orgDanger"
  | "profile"
  | "appearance"
  | "notifications"
  | "security"
  | "danger";

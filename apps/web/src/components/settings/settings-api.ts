import { MOCK_USER_MEMBERSHIPS } from "./mock-account-data";
import { MOCK_NOTIFICATION_PREFERENCES } from "./mock-notification-data";
import {
  MOCK_ORG_GENERAL_SETTINGS,
  MOCK_ORG_NOTIFICATION_SETTINGS,
  TAKEN_ORG_SLUGS,
} from "./mock-org-settings-data";
import { MOCK_USER_PROFILE } from "./mock-profile-data";
import { MOCK_SECURITY_SETTINGS } from "./mock-security-data";
import type {
  AccountDangerContext,
  AccountNotificationSettings,
  DateFormatStyle,
  DeleteOrganizationResult,
  NotificationPreferences,
  OrgDefaultNotificationEvents,
  OrgGeneralSettings,
  OrgNotificationSettings,
  SecuritySettings,
  SettingsPageData,
  SlugAvailability,
  UserLocalePreferences,
  UserProfile,
} from "./settings-types";

const LOAD_DELAY_MS = 500;

const SAVE_DELAY_MS = 600;

const SLUG_CHECK_DELAY_MS = 350;

const LOGO_UPLOAD_DELAY_MS = 1400;

const AVATAR_UPLOAD_DELAY_MS = 1200;

let orgSettingsStore: OrgGeneralSettings = { ...MOCK_ORG_GENERAL_SETTINGS };

let orgNotificationStore: OrgNotificationSettings = {
  ...MOCK_ORG_NOTIFICATION_SETTINGS,
  defaultEvents: { ...MOCK_ORG_NOTIFICATION_SETTINGS.defaultEvents },
};

let profileStore: UserProfile = {
  ...MOCK_USER_PROFILE,

  locale: { ...MOCK_USER_PROFILE.locale },
};

let notificationStore: NotificationPreferences = {
  ...MOCK_NOTIFICATION_PREFERENCES,
};

let securityStore: SecuritySettings = {
  ...MOCK_SECURITY_SETTINGS,
  sessions: MOCK_SECURITY_SETTINGS.sessions.map((s) => ({ ...s })),
  activity: MOCK_SECURITY_SETTINGS.activity.map((a) => ({ ...a })),
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeOrgSlug(value: string): string {
  return value

    .toLowerCase()

    .trim()

    .replace(/[^a-z0-9-]+/g, "-")

    .replace(/-+/g, "-")

    .replace(/^-|-$/g, "");
}

export function validateOrgSlug(slug: string): SlugAvailability {
  if (!slug || slug.length < 2) return "invalid";

  if (!SLUG_PATTERN.test(slug)) return "invalid";

  if (TAKEN_ORG_SLUGS.has(slug)) return "taken";

  return "available";
}

export async function fetchOrgGeneralSettingsMock(
  orgId: string,

  options?: { fail?: boolean }
): Promise<OrgGeneralSettings> {
  void orgId;

  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to load organization settings");
  }

  return { ...orgSettingsStore };
}

export async function checkSlugAvailabilityMock(
  orgId: string,

  slug: string,

  currentSlug: string,

  options?: { fail?: boolean }
): Promise<SlugAvailability> {
  void orgId;

  await new Promise((resolve) => setTimeout(resolve, SLUG_CHECK_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to check slug availability");
  }

  if (slug === currentSlug) return "available";

  return validateOrgSlug(slug);
}

export async function updateOrgNameMock(
  orgId: string,

  name: string,

  options?: { fail?: boolean }
): Promise<OrgGeneralSettings> {
  void orgId;

  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to update organization name");
  }

  orgSettingsStore = { ...orgSettingsStore, name: name.trim() };

  return { ...orgSettingsStore };
}

export async function updateOrgSlugMock(
  orgId: string,

  slug: string,

  options?: { fail?: boolean }
): Promise<OrgGeneralSettings> {
  void orgId;

  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to update organization slug");
  }

  const availability = validateOrgSlug(slug);

  if (availability !== "available" && slug !== orgSettingsStore.slug) {
    throw new Error("Slug is not available");
  }

  orgSettingsStore = { ...orgSettingsStore, slug };

  return { ...orgSettingsStore };
}

export async function uploadOrgLogoMock(
  orgId: string,

  file: File,

  onProgress?: (percent: number) => void,

  options?: { fail?: boolean }
): Promise<OrgGeneralSettings> {
  void orgId;

  const steps = [15, 40, 65, 85, 100];

  for (const step of steps) {
    await new Promise((resolve) =>
      setTimeout(resolve, LOGO_UPLOAD_DELAY_MS / steps.length)
    );

    onProgress?.(step);
  }

  if (options?.fail) {
    throw new Error("Failed to upload logo");
  }

  const logoUrl = URL.createObjectURL(file);

  orgSettingsStore = { ...orgSettingsStore, logoUrl };

  return { ...orgSettingsStore };
}

export async function removeOrgLogoMock(
  orgId: string,

  options?: { fail?: boolean }
): Promise<OrgGeneralSettings> {
  void orgId;

  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to remove logo");
  }

  orgSettingsStore = { ...orgSettingsStore, logoUrl: null };

  return { ...orgSettingsStore };
}

export async function updateOrgLocaleMock(
  orgId: string,

  patch: { timezone?: string; dateFormat?: DateFormatStyle },

  options?: { fail?: boolean }
): Promise<OrgGeneralSettings> {
  void orgId;

  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to update locale settings");
  }

  orgSettingsStore = { ...orgSettingsStore, ...patch };

  return { ...orgSettingsStore };
}

export function resetOrgSettingsMock(): void {
  orgSettingsStore = { ...MOCK_ORG_GENERAL_SETTINGS };
}

export async function fetchOrgNotificationSettingsMock(
  orgId: string,
  options?: { fail?: boolean }
): Promise<OrgNotificationSettings> {
  void orgId;
  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to load organization notification settings");
  }
  return {
    ...orgNotificationStore,
    defaultEvents: { ...orgNotificationStore.defaultEvents },
  };
}

export async function updateOrgEmailNotificationsEnabledMock(
  orgId: string,
  emailNotificationsEnabled: boolean,
  options?: { fail?: boolean }
): Promise<OrgNotificationSettings> {
  void orgId;
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to update email notification defaults");
  }
  orgNotificationStore = { ...orgNotificationStore, emailNotificationsEnabled };
  return {
    ...orgNotificationStore,
    defaultEvents: { ...orgNotificationStore.defaultEvents },
  };
}

export async function updateOrgDefaultNotificationEventsMock(
  orgId: string,
  defaultEvents: OrgDefaultNotificationEvents,
  options?: { fail?: boolean }
): Promise<OrgNotificationSettings> {
  void orgId;
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to update default notification events");
  }
  orgNotificationStore = {
    ...orgNotificationStore,
    defaultEvents: { ...defaultEvents },
  };
  return {
    ...orgNotificationStore,
    defaultEvents: { ...orgNotificationStore.defaultEvents },
  };
}

export async function updateOrgSenderIdentityMock(
  orgId: string,
  patch: { senderName: string; replyToEmail: string | null },
  options?: { fail?: boolean }
): Promise<OrgNotificationSettings> {
  void orgId;
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to update sender identity");
  }
  orgNotificationStore = {
    ...orgNotificationStore,
    senderName: patch.senderName.trim(),
    replyToEmail: patch.replyToEmail?.trim() || null,
  };
  return {
    ...orgNotificationStore,
    defaultEvents: { ...orgNotificationStore.defaultEvents },
  };
}

export function resetOrgNotificationSettingsMock(): void {
  orgNotificationStore = {
    ...MOCK_ORG_NOTIFICATION_SETTINGS,
    defaultEvents: { ...MOCK_ORG_NOTIFICATION_SETTINGS.defaultEvents },
  };
}

export async function fetchUserProfileMock(options?: {
  fail?: boolean;
}): Promise<UserProfile> {
  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to load profile");
  }

  return { ...profileStore, locale: { ...profileStore.locale } };
}

export async function updateUserFullNameMock(
  fullName: string,

  options?: { fail?: boolean }
): Promise<UserProfile> {
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to update name");
  }

  profileStore = { ...profileStore, fullName: fullName.trim() };

  return { ...profileStore, locale: { ...profileStore.locale } };
}

export async function requestEmailChangeMock(
  newEmail: string,

  options?: { fail?: boolean }
): Promise<{ profile: UserProfile; previousEmail: string }> {
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to update email");
  }

  const previousEmail = profileStore.email;

  profileStore = {
    ...profileStore,

    email: newEmail.trim(),

    emailVerified: false,
  };

  return {
    profile: { ...profileStore, locale: { ...profileStore.locale } },

    previousEmail,
  };
}

export async function uploadUserAvatarMock(
  file: File,

  onProgress?: (percent: number) => void,

  options?: { fail?: boolean }
): Promise<UserProfile> {
  const steps = [20, 45, 70, 90, 100];

  for (const step of steps) {
    await new Promise((resolve) =>
      setTimeout(resolve, AVATAR_UPLOAD_DELAY_MS / steps.length)
    );

    onProgress?.(step);
  }

  if (options?.fail) {
    throw new Error("Failed to upload avatar");
  }

  const avatarUrl = URL.createObjectURL(file);

  profileStore = { ...profileStore, avatarUrl };

  return { ...profileStore, locale: { ...profileStore.locale } };
}

export async function removeUserAvatarMock(options?: {
  fail?: boolean;
}): Promise<UserProfile> {
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to remove avatar");
  }

  profileStore = { ...profileStore, avatarUrl: null };

  return { ...profileStore, locale: { ...profileStore.locale } };
}

export async function changePasswordMock(
  _current: string,

  _next: string,

  options?: { fail?: boolean }
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to update password");
  }
}

export async function updateUserLocaleMock(
  patch: Partial<UserLocalePreferences>,

  options?: { fail?: boolean }
): Promise<UserProfile> {
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));

  if (options?.fail) {
    throw new Error("Failed to update locale settings");
  }

  profileStore = {
    ...profileStore,

    locale: { ...profileStore.locale, ...patch },
  };

  return { ...profileStore, locale: { ...profileStore.locale } };
}

export function resetUserProfileMock(): void {
  profileStore = {
    ...MOCK_USER_PROFILE,

    locale: { ...MOCK_USER_PROFILE.locale },
  };
}

export async function fetchUserSettingsMock(): Promise<SettingsPageData> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  return {
    profile: { ...profileStore, locale: { ...profileStore.locale } },

    notifications: {
      ...notificationStore,
      events: { ...notificationStore.events },
    },
  };
}

export async function updateNotificationPreferencesMock(
  prefs: NotificationPreferences
): Promise<NotificationPreferences> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  notificationStore = {
    events: { ...prefs.events },
    frequency: prefs.frequency,
    notificationEmail: prefs.notificationEmail,
  };
  return { ...notificationStore, events: { ...notificationStore.events } };
}

export async function fetchAccountNotificationSettingsMock(
  orgId: string,
  options?: { fail?: boolean }
): Promise<AccountNotificationSettings> {
  void orgId;
  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to load notification settings");
  }
  return {
    orgEmailNotificationsEnabled:
      orgNotificationStore.emailNotificationsEnabled,
    loginEmail: profileStore.email,
    preferences: {
      ...notificationStore,
      events: { ...notificationStore.events },
    },
  };
}

export async function deleteOrganizationMock(
  orgId: string
): Promise<DeleteOrganizationResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const otherOrgs = MOCK_USER_MEMBERSHIPS.filter(
    (membership) => membership.orgId !== orgId
  );
  if (otherOrgs.length > 0) {
    const next = otherOrgs[0];
    return {
      jobId: `del_${orgId}_${Date.now()}`,
      redirect: { type: "org", orgId: next.orgId, orgName: next.orgName },
    };
  }

  return {
    jobId: `del_${orgId}_${Date.now()}`,
    redirect: { type: "create-org" },
  };
}

export async function deleteAccountMock(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
}

export async function fetchAccountDangerContextMock(
  orgId: string
): Promise<AccountDangerContext> {
  void orgId;
  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    memberships: MOCK_USER_MEMBERSHIPS.map((membership) => ({ ...membership })),
  };
}

export async function leaveOrganizationMock(orgId: string): Promise<void> {
  void orgId;
  await new Promise((resolve) => setTimeout(resolve, 600));
}

function cloneSecurityStore(): SecuritySettings {
  return {
    ...securityStore,
    sessions: securityStore.sessions.map((s) => ({ ...s })),
    activity: securityStore.activity.map((a) => ({ ...a })),
  };
}

export async function fetchSecuritySettingsMock(options?: {
  fail?: boolean;
}): Promise<SecuritySettings> {
  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to load security settings");
  }
  return cloneSecurityStore();
}

export async function revokeSessionMock(
  sessionId: string,
  options?: { fail?: boolean }
): Promise<SecuritySettings> {
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to sign out session");
  }
  const session = securityStore.sessions.find((s) => s.id === sessionId);
  if (!session || session.isCurrent) {
    throw new Error("Cannot revoke current session");
  }
  securityStore = {
    ...securityStore,
    sessions: securityStore.sessions.filter((s) => s.id !== sessionId),
    activity: [
      {
        id: `activity-${Date.now()}`,
        type: "session_revoked",
        description: `Signed out of ${session.deviceLabel}`,
        occurredAt: new Date(),
      },
      ...securityStore.activity,
    ],
  };
  return cloneSecurityStore();
}

export async function revokeAllOtherSessionsMock(options?: {
  fail?: boolean;
}): Promise<SecuritySettings> {
  await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to sign out other devices");
  }
  const revokedCount = securityStore.sessions.filter(
    (s) => !s.isCurrent
  ).length;
  securityStore = {
    ...securityStore,
    sessions: securityStore.sessions.filter((s) => s.isCurrent),
    activity:
      revokedCount > 0
        ? [
            {
              id: `activity-${Date.now()}`,
              type: "session_revoked",
              description: `Signed out of ${revokedCount} other device${revokedCount === 1 ? "" : "s"}`,
              occurredAt: new Date(),
            },
            ...securityStore.activity,
          ]
        : securityStore.activity,
  };
  return cloneSecurityStore();
}

import type { SettingsSectionId } from "./settings-types";

export function defaultSettingsSection(
  showOrgGroup: boolean
): SettingsSectionId {
  return showOrgGroup ? "organization" : "profile";
}

export function isOrgSettingsSection(section: SettingsSectionId): boolean {
  return (
    section === "organization" ||
    section === "organizationNotifications" ||
    section === "orgDanger"
  );
}

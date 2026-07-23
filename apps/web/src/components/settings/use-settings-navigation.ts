import { createContext, useContext } from "react";

import type { SettingsSectionId } from "./settings-types";

export interface SettingsNavigationContextValue {
  goToSection: (section: SettingsSectionId) => void;
}

export const SettingsNavigationContext =
  createContext<SettingsNavigationContextValue | null>(null);

export function useSettingsNavigation() {
  const ctx = useContext(SettingsNavigationContext);
  if (!ctx) {
    throw new Error(
      "useSettingsNavigation must be used within SettingsNavigationProvider"
    );
  }
  return ctx;
}

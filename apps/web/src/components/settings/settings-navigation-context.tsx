import { createContext, useContext } from "react";

import type { SettingsSectionId } from "./settings-types";

interface SettingsNavigationContextValue {
  goToSection: (section: SettingsSectionId) => void;
}

const SettingsNavigationContext =
  createContext<SettingsNavigationContextValue | null>(null);

export function SettingsNavigationProvider({
  goToSection,
  children,
}: SettingsNavigationContextValue & { children: React.ReactNode }) {
  return (
    <SettingsNavigationContext.Provider value={{ goToSection }}>
      {children}
    </SettingsNavigationContext.Provider>
  );
}

export function useSettingsNavigation() {
  const ctx = useContext(SettingsNavigationContext);
  if (!ctx) {
    throw new Error(
      "useSettingsNavigation must be used within SettingsNavigationProvider"
    );
  }
  return ctx;
}

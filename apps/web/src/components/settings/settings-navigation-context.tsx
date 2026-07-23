import {
  SettingsNavigationContext,
  type SettingsNavigationContextValue,
} from "./use-settings-navigation";

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

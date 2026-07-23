import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedColorMode = "light" | "dark";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** True once the component tree is mounted on the client. */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}

export function useColorMode() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const mounted = useMounted();

  const colorMode = (resolvedTheme ?? "light") as ResolvedColorMode;
  const preference = (theme ?? "system") as ThemePreference;

  return {
    colorMode,
    preference,
    systemTheme: systemTheme ?? "light",
    setColorMode: setTheme,
    toggleColorMode: () => {
      setTheme(colorMode === "dark" ? "light" : "dark");
    },
    mounted,
  };
}

export function useColorModeValue<T>(light: T, dark: T): T {
  const { colorMode, mounted } = useColorMode();
  if (!mounted) return light;
  return colorMode === "dark" ? dark : light;
}

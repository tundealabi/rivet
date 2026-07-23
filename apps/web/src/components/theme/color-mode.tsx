import { Button } from "@chakra-ui/react";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PiMoon, PiSun } from "react-icons/pi";

export const THEME_STORAGE_KEY = "rivet-theme";
const LEGACY_LANDING_THEME_KEY = "rivet-landing-theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedColorMode = "light" | "dark";

function migrateLegacyThemePreference() {
  if (typeof window === "undefined") return;

  const current = localStorage.getItem(THEME_STORAGE_KEY);
  if (current) return;

  const legacy = localStorage.getItem(LEGACY_LANDING_THEME_KEY);
  if (legacy === "dark" || legacy === "light") {
    localStorage.setItem(THEME_STORAGE_KEY, legacy);
  }
}

export function ColorModeProvider({
  children,
  ...props
}: React.ComponentProps<typeof ThemeProvider>) {
  useEffect(() => {
    migrateLegacyThemePreference();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </ThemeProvider>
  );
}

export function useColorMode() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

export interface ColorModeToggleProps {
  collapsed?: boolean;
}

export function ColorModeToggle({ collapsed = false }: ColorModeToggleProps) {
  const { colorMode, toggleColorMode, mounted } = useColorMode();

  if (!mounted) {
    return null;
  }

  const isDark = colorMode === "dark";
  const label = isDark ? "Light mode" : "Dark mode";

  return (
    <Button
      variant="outline"
      size="sm"
      borderRadius="control"
      borderColor="border.default"
      color="fg.secondary"
      fontWeight="medium"
      justifyContent={collapsed ? "center" : "flex-start"}
      px={collapsed ? "0" : undefined}
      minW={collapsed ? "10" : undefined}
      aria-label={label}
      title={label}
      onClick={toggleColorMode}
      _hover={{ bg: "bg.surfaceHover", color: "fg.primary" }}
    >
      {isDark ? <PiSun size={16} /> : <PiMoon size={16} />}
      {!collapsed ? label : null}
    </Button>
  );
}

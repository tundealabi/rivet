import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { useColorMode } from "../theme/use-color-mode";
import { DARK_THEME, LIGHT_THEME, palette } from "./palette";

export function LandingThemeScope({ children }: { children: ReactNode }) {
  const { colorMode, mounted } = useColorMode();
  const isDark = mounted && colorMode === "dark";

  return (
    <Box
      minH="100svh"
      bg={palette.canvas}
      position="relative"
      style={isDark ? DARK_THEME : LIGHT_THEME}
      colorScheme={isDark ? "dark" : "light"}
      transition="background-color 0.25s ease"
    >
      {children}
    </Box>
  );
}

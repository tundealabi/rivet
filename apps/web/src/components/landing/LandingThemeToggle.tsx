import { Button } from "@chakra-ui/react";
import { PiMoon, PiSun } from "react-icons/pi";

import { useColorMode } from "../theme/color-mode";
import { palette } from "./palette";

export function LandingThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <Button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleColorMode}
      size="xs"
      minW="8"
      px="0"
      borderRadius="full"
      bg={palette.surface}
      color={palette.fgSecondary}
      borderWidth="1px"
      borderColor={palette.border}
      _hover={{ color: palette.brand, borderColor: palette.brandSoft }}
    >
      {isDark ? <PiSun size={15} /> : <PiMoon size={15} />}
    </Button>
  );
}

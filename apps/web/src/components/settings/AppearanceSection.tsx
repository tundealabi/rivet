import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import { PiDesktop, PiMoon, PiSun } from "react-icons/pi";

import { fadeIn } from "../issues/issues-motion";
import { type ThemePreference, useColorMode } from "../theme/use-color-mode";
import {
  SettingsSectionHeader,
  SettingsSettingCard,
} from "./SettingsSettingCard";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  description: string;
  icon: typeof PiSun;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Bright surfaces and dark text",
    icon: PiSun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dimmed backgrounds for low-light work",
    icon: PiMoon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow your device appearance setting",
    icon: PiDesktop,
  },
];

export function AppearanceSection() {
  const { preference, setColorMode, mounted } = useColorMode();

  return (
    <Box maxW="2xl" {...fadeIn}>
      <SettingsSectionHeader
        breadcrumb="Account"
        title="Appearance"
        subtitle="Choose how Rivet looks on this device."
      />

      <SettingsSettingCard>
        <Text fontSize="sm" fontWeight="semibold" color="fg.primary" mb="4">
          Color mode
        </Text>

        <Stack gap="2">
          {THEME_OPTIONS.map((option) => {
            const active = mounted && preference === option.value;
            const Icon = option.icon;

            return (
              <Flex
                key={option.value}
                as="button"
                align="center"
                gap="3"
                w="full"
                px="4"
                py="3"
                borderRadius="control"
                borderWidth="1px"
                borderColor={active ? "accent.default" : "border.default"}
                bg={active ? "brand.subtle" : "bg.surface"}
                textAlign="left"
                cursor="pointer"
                transition="border-color 0.15s ease, background-color 0.15s ease"
                _hover={{
                  borderColor: active ? "accent.default" : "border.default",
                  bg: active ? "brand.subtle" : "bg.surfaceHover",
                }}
                onClick={() => setColorMode(option.value)}
                aria-pressed={active}
              >
                <Flex
                  boxSize="9"
                  align="center"
                  justify="center"
                  borderRadius="control"
                  bg={active ? "accent.default" : "bg.surfaceHover"}
                  color={active ? "white" : "fg.secondary"}
                  flexShrink="0"
                >
                  <Icon size={18} />
                </Flex>
                <Box minW="0">
                  <Text fontSize="sm" fontWeight="semibold" color="fg.primary">
                    {option.label}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                    {option.description}
                  </Text>
                </Box>
              </Flex>
            );
          })}
        </Stack>
      </SettingsSettingCard>
    </Box>
  );
}

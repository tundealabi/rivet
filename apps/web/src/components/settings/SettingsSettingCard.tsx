import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface SettingsSettingCardProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Increment to replay the save-success border flash. */
  flashKey?: number;
}

export function SettingsSettingCard({
  children,
  footer,
  flashKey = 0,
}: SettingsSettingCardProps) {
  const [borderColor, setBorderColor] = useState("border.default");

  useEffect(() => {
    if (flashKey === 0) return;

    setBorderColor("status.success");
    const fadeTimer = window.setTimeout(
      () => setBorderColor("border.default"),
      60
    );

    return () => window.clearTimeout(fadeTimer);
  }, [flashKey]);

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="card"
      bg="bg.surface"
      p={{ base: "5", md: "6" }}
      transition="border-color 1s ease-out"
    >
      {children}
      {footer && (
        <Flex justify="flex-end" mt="5" pt="1">
          {footer}
        </Flex>
      )}
    </Box>
  );
}

interface SettingsSectionHeaderProps {
  breadcrumb: string;
  title: string;
  subtitle: string;
}

export function SettingsSectionHeader({
  breadcrumb,
  title,
  subtitle,
}: SettingsSectionHeaderProps) {
  return (
    <Box mb="8">
      <Box fontSize="xs" color="fg.muted" mb="2" letterSpacing="0.01em">
        {breadcrumb}
      </Box>
      <Box
        as="h1"
        fontSize="xl"
        fontWeight="600"
        color="fg.primary"
        letterSpacing="-0.02em"
        mb="1"
      >
        {title}
      </Box>
      <Box fontSize="sm" color="fg.muted" lineHeight="1.5">
        {subtitle}
      </Box>
    </Box>
  );
}

import { Box, Flex, HStack, Link, Stack, Text } from "@chakra-ui/react";
import { PiFacebookLogo, PiInstagramLogo, PiXLogo } from "react-icons/pi";

import { BrandMark } from "./BrandMark";
import { palette } from "./palette";

const FOOTER_COLUMNS = [
  {
    heading: "Company",
    links: ["About Us", "Careers", "Press"],
  },
  {
    heading: "Resources",
    links: ["Blog", "Help Center", "Community"],
  },
  {
    heading: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  },
  {
    heading: "Contact",
    links: ["Support", "Sales", "General Inquiries"],
  },
];

const SOCIAL_ICONS = [
  { label: "Facebook", icon: PiFacebookLogo },
  { label: "Instagram", icon: PiInstagramLogo },
  { label: "X", icon: PiXLogo },
];

export function LandingFooter() {
  return (
    <Box
      as="footer"
      borderTopWidth="1px"
      borderColor={palette.border}
      bg={palette.surface}
    >
      <Flex
        maxW="7xl"
        mx="auto"
        px={{ base: "6", md: "12" }}
        py={{ base: "12", md: "16" }}
        direction={{ base: "column", md: "row" }}
        gap={{ base: "12", md: "20" }}
      >
        <Stack gap="6" flex="1.2">
          <BrandMark />
          <HStack gap="4">
            {SOCIAL_ICONS.map((social) => (
              <Link
                key={social.label}
                href="#"
                aria-label={social.label}
                color={palette.fgMuted}
                _hover={{ color: palette.fg }}
              >
                <social.icon size={18} />
              </Link>
            ))}
          </HStack>
        </Stack>

        <Flex
          flex="3"
          wrap="wrap"
          gap={{ base: "10", md: "8" }}
          justify={{ md: "space-between" }}
        >
          {FOOTER_COLUMNS.map((column) => (
            <Stack key={column.heading} gap="3.5" minW="36">
              <Text fontSize="xs" fontWeight="semibold" color={palette.fg}>
                {column.heading}
              </Text>
              {column.links.map((link) => (
                <Link
                  key={link}
                  href="#"
                  fontSize="xs"
                  color={palette.fgMuted}
                  _hover={{ color: palette.fg, textDecoration: "none" }}
                >
                  {link}
                </Link>
              ))}
            </Stack>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}

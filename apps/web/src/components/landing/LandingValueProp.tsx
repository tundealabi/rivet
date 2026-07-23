import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import { palette } from "./palette";

export function LandingValueProp() {
  return (
    <Box
      as="section"
      id="about"
      position="relative"
      overflow="hidden"
      borderTopWidth="1px"
      borderColor={palette.border}
    >
      <Box
        position="absolute"
        top="-72px"
        right="8%"
        w="48%"
        h="90px"
        bg={palette.brandSoft}
        opacity="0.35"
        filter="blur(55px)"
        transform="rotate(-8deg)"
        pointerEvents="none"
      />

      <Flex
        maxW="7xl"
        mx="auto"
        px={{ base: "6", md: "12" }}
        py={{ base: "20", md: "28" }}
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        gap={{ base: "10", md: "24" }}
      >
        <Heading
          flex="1"
          maxW="md"
          color={palette.fg}
          fontSize={{ base: "3xl", md: "4xl" }}
          lineHeight="1.12"
          letterSpacing="-0.03em"
          fontWeight="medium"
        >
          Focused issue tracking for every team.
        </Heading>

        <Text
          flex="1"
          maxW="lg"
          color={palette.fgMuted}
          fontSize={{ base: "sm", md: "md" }}
          lineHeight="1.75"
        >
          Rivet gives teams one clear place to organize projects, assign work,
          and move issues forward. From small product squads to growing
          organizations, everyone stays aligned with simple workflows, clear
          ownership, and the context needed to ship confidently.
        </Text>
      </Flex>
    </Box>
  );
}

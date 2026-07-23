import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { PiKanban, PiRocketLaunch, PiUsersThree } from "react-icons/pi";

import { palette } from "./palette";

const STEPS = [
  {
    title: "Create Your Workspace",
    body: "Sign up, set up your organization, and invite your teammates — no setup calls, no onboarding maze.",
    icon: PiUsersThree,
  },
  {
    title: "Set Up Projects",
    body: "Create projects, define priorities, and assign issues with clear ownership across your team.",
    icon: PiKanban,
  },
  {
    title: "Ship With Clarity",
    body: "Track issues from open to done, discuss with context, and export reports whenever you need them.",
    icon: PiRocketLaunch,
  },
];

export function LandingHowItWorks() {
  return (
    <Box as="section" id="how-it-works" py={{ base: "20", md: "28" }} px="6">
      <Heading
        textAlign="center"
        color={palette.fg}
        fontSize={{ base: "3xl", md: "4xl" }}
        letterSpacing="-0.03em"
        fontWeight="medium"
        mb={{ base: "14", md: "20" }}
      >
        How it works?
      </Heading>

      <Box position="relative" maxW="3xl" mx="auto">
        <Box
          position="absolute"
          left="50%"
          top="2"
          bottom="2"
          w="1px"
          bg={palette.border}
          display={{ base: "none", md: "block" }}
        />

        <Stack gap={{ base: "12", md: "16" }}>
          {STEPS.map((step, i) => {
            const reversed = i % 2 === 1;
            return (
              <Flex
                key={step.title}
                direction={{
                  base: "column",
                  md: reversed ? "row-reverse" : "row",
                }}
                align="center"
              >
                <Box
                  flex="1"
                  px={{ base: "0", md: "8" }}
                  textAlign={{
                    base: "center",
                    md: reversed ? "left" : "right",
                  }}
                  order={{ base: 2, md: 0 }}
                >
                  <Text
                    fontWeight="semibold"
                    color={palette.fg}
                    fontSize="sm"
                    mb="1.5"
                  >
                    {step.title}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={palette.fgMuted}
                    lineHeight="1.7"
                    maxW="xs"
                    mx={{ base: "auto", md: "0" }}
                    ml={{ md: reversed ? "0" : "auto" }}
                  >
                    {step.body}
                  </Text>
                </Box>

                <Box
                  display={{ base: "none", md: "block" }}
                  boxSize="2"
                  borderRadius="full"
                  bg={palette.brand}
                  flexShrink="0"
                  position="relative"
                  zIndex="1"
                  boxShadow={`0 0 10px ${palette.brand}`}
                />

                <Flex
                  flex="1"
                  px={{ base: "0", md: "8" }}
                  justify={{
                    base: "center",
                    md: reversed ? "flex-end" : "flex-start",
                  }}
                  order={{ base: 1, md: 0 }}
                  mb={{ base: "4", md: "0" }}
                >
                  <Flex
                    boxSize="14"
                    align="center"
                    justify="center"
                    borderRadius="control"
                    bg={palette.brandSubtle}
                    borderWidth="1px"
                    borderColor="rgba(79, 70, 229, 0.2)"
                    color={palette.brand}
                    boxShadow="0 8px 24px rgba(79, 70, 229, 0.12)"
                  >
                    <step.icon size={26} />
                  </Flex>
                </Flex>
              </Flex>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}

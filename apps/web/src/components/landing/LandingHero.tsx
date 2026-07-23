import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PiLightningFill } from "react-icons/pi";
import { useNavigate } from "react-router-dom";

import { palette } from "./palette";

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <Flex
      as="section"
      id="home"
      direction="column"
      align="center"
      textAlign="center"
      maxW="3xl"
      mx="auto"
      px="6"
      pt={{ base: "20", md: "28" }}
      pb={{ base: "24", md: "36" }}
    >
      <HStack
        gap="1.5"
        px="3.5"
        py="1.5"
        mb="7"
        borderRadius="badge"
        bg={palette.brandSubtle}
        borderWidth="1px"
        borderColor="rgba(79, 70, 229, 0.18)"
        color={palette.fgSecondary}
        fontSize="xs"
        fontWeight="medium"
      >
        <Box color={palette.brand} lineHeight="0">
          <PiLightningFill size={12} />
        </Box>
        <Text>Built for teams that ship</Text>
      </HStack>

      <Heading
        color={palette.fg}
        fontSize={{ base: "4xl", md: "6xl" }}
        lineHeight="1.12"
        letterSpacing="-0.03em"
        fontWeight="semibold"
        mb="6"
      >
        Track Every Issue.
        <br />
        Ship Without Chaos.
      </Heading>

      <Text
        color={palette.fgMuted}
        fontSize={{ base: "sm", md: "md" }}
        maxW="lg"
        mb="10"
      >
        Rivet delivers fast, organized issue tracking — projects, priorities,
        and roles that keep even the most ambitious teams moving.
      </Text>

      <Stack direction={{ base: "column", sm: "row" }} gap="4">
        <Button
          size="lg"
          px="8"
          borderRadius="badge"
          bg={palette.brand}
          color="white"
          fontWeight="semibold"
          fontSize="sm"
          _hover={{ bg: palette.brandHover }}
          onClick={() => void navigate("/register")}
        >
          Get started free
        </Button>
        <Button
          size="lg"
          px="8"
          borderRadius="badge"
          bg={palette.surface}
          color={palette.fg}
          fontWeight="semibold"
          fontSize="sm"
          borderWidth="1px"
          borderColor={palette.border}
          _hover={{
            bg: palette.brandSubtle,
            borderColor: palette.brandSoft,
          }}
        >
          See how it works
        </Button>
      </Stack>
    </Flex>
  );
}

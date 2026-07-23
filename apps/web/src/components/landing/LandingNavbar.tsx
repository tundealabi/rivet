import { Button, Flex, HStack, Link } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { isAuthenticated } from "../../auth-api";
import { useColorMode } from "../theme/use-color-mode";
import { BrandMark } from "./BrandMark";
import { scrollToLandingSection } from "./landing-scroll";
import { LandingThemeToggle } from "./LandingThemeToggle";
import { palette } from "./palette";

const NAV_LINKS = [
  { label: "Home", sectionId: "home" },
  { label: "How it works", sectionId: "how-it-works" },
  { label: "Pricing", sectionId: "pricing" },
  { label: "FAQ", sectionId: "faq" },
] as const;

export function LandingNavbar() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const { mounted } = useColorMode();

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      maxW="7xl"
      mx="auto"
      px={{ base: "5", md: "8" }}
      py="4"
    >
      <BrandMark />

      <HStack gap="8" display={{ base: "none", md: "flex" }}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.sectionId}
            href={`#${link.sectionId}`}
            fontSize="xs"
            fontWeight="medium"
            color={palette.fgSecondary}
            _hover={{ color: palette.fg, textDecoration: "none" }}
            onClick={(event) => {
              event.preventDefault();
              scrollToLandingSection(link.sectionId);
            }}
          >
            {link.label}
          </Link>
        ))}
      </HStack>

      <HStack gap={{ base: "3", md: "6" }}>
        <Link
          href="#"
          fontSize="xs"
          fontWeight="medium"
          color={palette.fgSecondary}
          display={{ base: "none", sm: "inline-flex" }}
          _hover={{ color: palette.fg, textDecoration: "none" }}
        >
          Docs
        </Link>
        {!loggedIn && (
          <Link
            href="/login"
            fontSize="xs"
            fontWeight="medium"
            color={palette.fgSecondary}
            _hover={{ color: palette.fg, textDecoration: "none" }}
          >
            Log In
          </Link>
        )}
        {mounted ? <LandingThemeToggle /> : null}
        <Button
          size="xs"
          px="4"
          borderRadius="control"
          bg={palette.brand}
          color="white"
          fontWeight="semibold"
          _hover={{ bg: palette.brandHover }}
          onClick={() => void navigate(loggedIn ? "/dashboard" : "/register")}
        >
          {loggedIn ? "Dashboard" : "Sign up"}
        </Button>
      </HStack>
    </Flex>
  );
}

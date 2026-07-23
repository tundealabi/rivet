import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { PiNutFill } from "react-icons/pi";
import { Link as RouterLink } from "react-router-dom";

import { scaleIn } from "../issues/issues-motion";

export interface StatePageAction {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: "primary" | "outline";
}

export interface StatePageShellProps {
  code?: string;
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  description: ReactNode;
  actions?: StatePageAction[];
  children?: ReactNode;
}

function BrandMark() {
  return (
    <RouterLink to="/" style={{ textDecoration: "none" }}>
      <Flex align="center" gap="2.5">
        <Flex
          boxSize="8"
          align="center"
          justify="center"
          borderRadius="control"
          bg="accent.default"
          color="white"
        >
          <PiNutFill size={18} />
        </Flex>
        <Text
          fontSize="lg"
          fontWeight="bold"
          color="fg.primary"
          letterSpacing="-0.02em"
        >
          Rivet
        </Text>
      </Flex>
    </RouterLink>
  );
}

export function StatePageShell({
  code,
  icon,
  iconBg = "bg.surfaceHover",
  iconColor = "fg.muted",
  title,
  description,
  actions = [],
  children,
}: StatePageShellProps) {
  return (
    <Flex
      minH="100svh"
      direction="column"
      align="center"
      justify="center"
      bg="bg.canvas"
      px="6"
      py="12"
      position="relative"
      overflow="hidden"
    >
      {code ? (
        <Text
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -52%)"
          fontSize={{ base: "8rem", md: "12rem" }}
          fontWeight="bold"
          color="fg.primary"
          opacity="0.04"
          letterSpacing="-0.06em"
          userSelect="none"
          aria-hidden
        >
          {code}
        </Text>
      ) : null}

      <Box position="absolute" top="8" left={{ base: "6", md: "10" }}>
        <BrandMark />
      </Box>

      <Flex
        direction="column"
        align="center"
        textAlign="center"
        maxW="md"
        w="full"
        px="6"
        py="10"
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="card"
        bg="bg.surface"
        boxShadow="card"
        position="relative"
        zIndex="1"
        {...scaleIn}
      >
        <Flex
          boxSize="14"
          align="center"
          justify="center"
          borderRadius="full"
          bg={iconBg}
          color={iconColor}
          mb="5"
        >
          {icon}
        </Flex>

        {code ? (
          <Text
            fontSize="xs"
            fontWeight="semibold"
            letterSpacing="0.08em"
            textTransform="uppercase"
            color="fg.muted"
            mb="2"
          >
            {code}
          </Text>
        ) : null}

        <Heading size="lg" color="fg.primary" mb="3" letterSpacing="-0.02em">
          {title}
        </Heading>

        <Text
          fontSize="sm"
          color="fg.secondary"
          lineHeight="1.65"
          maxW="sm"
          mb={actions.length > 0 || children ? "8" : "0"}
        >
          {description}
        </Text>

        {children}

        {actions.length > 0 ? (
          <Flex gap="3" flexWrap="wrap" justify="center">
            {actions.map((action) => {
              const isPrimary = action.variant !== "outline";

              if (action.to) {
                return (
                  <Button
                    key={action.label}
                    asChild
                    size="sm"
                    borderRadius="control"
                    fontWeight="semibold"
                    variant={isPrimary ? "solid" : "outline"}
                    bg={isPrimary ? "accent.default" : undefined}
                    color={isPrimary ? "white" : "fg.primary"}
                    borderColor={isPrimary ? undefined : "border.default"}
                    _hover={
                      isPrimary
                        ? { bg: "accent.hover" }
                        : { bg: "bg.surfaceHover" }
                    }
                  >
                    <RouterLink to={action.to}>{action.label}</RouterLink>
                  </Button>
                );
              }

              return (
                <Button
                  key={action.label}
                  size="sm"
                  borderRadius="control"
                  fontWeight="semibold"
                  variant={isPrimary ? "solid" : "outline"}
                  bg={isPrimary ? "accent.default" : undefined}
                  color={isPrimary ? "white" : "fg.primary"}
                  borderColor={isPrimary ? undefined : "border.default"}
                  _hover={
                    isPrimary
                      ? { bg: "accent.hover" }
                      : { bg: "bg.surfaceHover" }
                  }
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              );
            })}
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}

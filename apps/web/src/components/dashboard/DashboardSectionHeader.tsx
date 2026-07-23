import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

interface DashboardSectionHeaderProps {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function DashboardSectionHeader({
  title,
  viewAllHref,
  viewAllLabel = "View all",
}: DashboardSectionHeaderProps) {
  return (
    <Flex align="center" justify="space-between" mb="4" gap="3">
      <Text
        fontSize="md"
        fontWeight="semibold"
        color="fg.primary"
        letterSpacing="-0.01em"
      >
        {title}
      </Text>
      {viewAllHref && (
        <RouterLink to={viewAllHref} style={{ textDecoration: "none" }}>
          <Text
            fontSize="sm"
            color="accent.default"
            fontWeight="medium"
            _hover={{ textDecoration: "underline" }}
          >
            {viewAllLabel}
          </Text>
        </RouterLink>
      )}
    </Flex>
  );
}

export function DashboardSection({ children }: { children: React.ReactNode }) {
  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      px={{ base: "4", md: "5" }}
      py="5"
    >
      {children}
    </Box>
  );
}

export function DashboardSectionEmpty({
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <Box py="2">
      <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
        {message}
      </Text>
      {secondaryActionLabel && onSecondaryAction && (
        <Text
          as="button"
          display="inline-block"
          mt="2"
          fontSize="sm"
          color="accent.default"
          fontWeight="medium"
          cursor="pointer"
          bg="transparent"
          border="none"
          p="0"
          onClick={onSecondaryAction}
          _hover={{ textDecoration: "underline" }}
        >
          {secondaryActionLabel}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          mt="3"
          px="4"
          py="2"
          h="auto"
          borderRadius="full"
          bg="accent.default"
          color="white"
          fontSize="sm"
          fontWeight="semibold"
          _hover={{ bg: "accent.hover" }}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

/** Subtle row divider for list sections — not a bordered table cell. */
export function DashboardRowDivider() {
  return <Box borderTopWidth="1px" borderColor="border.divider" />;
}

/** Compact meta line: dot-separated secondary facts. */
export function DashboardMetaLine({ children }: { children: React.ReactNode }) {
  return (
    <HStack gap="1.5" flexWrap="wrap" mt="1">
      {children}
    </HStack>
  );
}

export function DashboardMetaItem({
  children,
  color = "fg.muted",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Text fontSize="xs" color={color} whiteSpace="nowrap">
      {children}
    </Text>
  );
}

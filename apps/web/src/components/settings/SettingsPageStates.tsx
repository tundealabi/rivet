import { Box, Button, Flex, Skeleton, Text } from "@chakra-ui/react";
import { PiLock, PiWarningCircle } from "react-icons/pi";

import { fadeInUp, scaleIn } from "../issues/issues-motion";
import { useSettingsNavigation } from "./settings-navigation-context";

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, var(--chakra-colors-bg-surfaceHover) 0%, var(--chakra-colors-bg-surface) 50%, var(--chakra-colors-bg-surfaceHover) 100%)",
  backgroundSize: "200% 100%",
  animation: "rivet-shimmer 1.4s ease-in-out infinite",
};

export function SettingsNavSkeleton() {
  return (
    <Box
      w="52"
      flexShrink="0"
      display={{ base: "none", lg: "block" }}
      aria-hidden
    >
      <Skeleton h="3" w="24" mb="3" ml="2" css={shimmerStyle} />
      <Flex direction="column" gap="2" mb="8">
        {[0, 1].map((i) => (
          <Skeleton
            key={i}
            h="9"
            w="full"
            borderRadius="control"
            css={shimmerStyle}
          />
        ))}
      </Flex>
      <Skeleton h="3" w="20" mb="3" ml="2" css={shimmerStyle} />
      <Flex direction="column" gap="2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            h="9"
            w="full"
            borderRadius="control"
            css={shimmerStyle}
          />
        ))}
      </Flex>
    </Box>
  );
}

export function SettingsSectionSkeleton() {
  return (
    <Box maxW="2xl" {...fadeInUp}>
      <Skeleton h="3" w="36" mb="3" css={shimmerStyle} />
      <Skeleton h="7" w="28" mb="2" css={shimmerStyle} />
      <Skeleton h="4" w="64" mb="8" css={shimmerStyle} />

      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="card"
          bg="bg.surface"
          p={{ base: "5", md: "6" }}
          mb="4"
        >
          <Skeleton h="4" w="32" mb="4" css={shimmerStyle} />
          <Skeleton
            h="10"
            w="full"
            mb="3"
            borderRadius="control"
            css={shimmerStyle}
          />
          <Skeleton h="3" w="48" css={shimmerStyle} />
        </Box>
      ))}
    </Box>
  );
}

export function SettingsPageSkeleton() {
  return (
    <Flex gap={{ base: 0, lg: "10" }} align="flex-start">
      <SettingsNavSkeleton />
      <Box flex="1" minW="0">
        <SettingsSectionSkeleton />
      </Box>
    </Flex>
  );
}

export function SettingsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py="20"
      px="6"
      textAlign="center"
      {...scaleIn}
    >
      <Flex
        boxSize="14"
        align="center"
        justify="center"
        borderRadius="full"
        bg="billing.error.bg"
        color="status.error"
        mb="4"
      >
        <PiWarningCircle size={28} />
      </Flex>
      <Text fontSize="md" fontWeight="semibold" color="fg.primary" mb="2">
        Couldn&apos;t load settings
      </Text>
      <Text
        fontSize="sm"
        color="fg.secondary"
        maxW="sm"
        mb="6"
        lineHeight="1.6"
      >
        Something went wrong while fetching your settings. Please try again.
      </Text>
      <Box
        as="button"
        px="4"
        py="2"
        borderRadius="control"
        bg="accent.default"
        color="white"
        fontWeight="semibold"
        fontSize="sm"
        _hover={{ bg: "accent.hover" }}
        onClick={onRetry}
      >
        Retry
      </Box>
    </Flex>
  );
}

export function SettingsPermissionDeniedState() {
  const { goToSection } = useSettingsNavigation();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="24"
      px="6"
      {...scaleIn}
    >
      <Flex
        boxSize="14"
        align="center"
        justify="center"
        borderRadius="full"
        bg="bg.surfaceHover"
        color="fg.muted"
        mb="5"
      >
        <PiLock size={28} />
      </Flex>
      <Text
        fontSize="md"
        fontWeight="semibold"
        color="fg.primary"
        mb="2"
        letterSpacing="-0.02em"
      >
        You don&apos;t have permission
      </Text>
      <Text
        fontSize="sm"
        color="fg.secondary"
        maxW="sm"
        lineHeight="1.6"
        mb="6"
      >
        Only admins and owners can manage organization settings.
      </Text>
      <Button
        variant="outline"
        size="sm"
        borderRadius="control"
        borderColor="border.default"
        fontWeight="medium"
        onClick={() => goToSection("profile")}
      >
        Go to Profile
      </Button>
    </Flex>
  );
}

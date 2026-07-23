import { Box, Button, Flex, Heading, Skeleton, Text } from "@chakra-ui/react";
import { PiLock, PiWarningCircle } from "react-icons/pi";

import { fadeInUp, scaleIn } from "../issues/issues-motion";

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, var(--chakra-colors-bg-surfaceHover) 0%, var(--chakra-colors-bg-surface) 50%, var(--chakra-colors-bg-surfaceHover) 100%)",
  backgroundSize: "200% 100%",
  animation: "rivet-shimmer 1.4s ease-in-out infinite",
};

export function BillingPageSkeleton() {
  return (
    <Box
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      p={{ base: "6", md: "8" }}
      {...fadeInUp}
    >
      <Flex
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        direction={{ base: "column", md: "row" }}
        gap="6"
      >
        <Box flex="1">
          <Skeleton h="8" w="24" mb="3" css={shimmerStyle} />
          <Skeleton h="5" w="40" mb="2" css={shimmerStyle} />
          <Skeleton h="4" w="36" css={shimmerStyle} />
        </Box>
        <Box alignSelf={{ base: "stretch", md: "flex-end" }}>
          <Skeleton h="10" w="32" borderRadius="control" css={shimmerStyle} />
          <Skeleton h="3" w="28" mt="3" mx="auto" css={shimmerStyle} />
        </Box>
      </Flex>
    </Box>
  );
}

export function BillingErrorState({ onRetry }: { onRetry: () => void }) {
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
        bg="danger.ghostHover"
        color="status.error"
        mb="4"
      >
        <PiWarningCircle size={28} />
      </Flex>
      <Heading size="md" color="fg.primary" mb="2">
        Couldn&apos;t load billing
      </Heading>
      <Text fontSize="sm" color="fg.secondary" maxW="sm" mb="6">
        Something went wrong while fetching your subscription details. Please
        try again.
      </Text>
      <Button
        borderRadius="control"
        bg="accent.default"
        color="white"
        _hover={{ bg: "accent.hover" }}
        onClick={onRetry}
      >
        Retry
      </Button>
    </Flex>
  );
}

export function BillingPermissionDeniedState() {
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
      <Heading size="md" color="fg.primary" mb="2" letterSpacing="-0.02em">
        You don&apos;t have permission
      </Heading>
      <Text fontSize="sm" color="fg.secondary" maxW="sm" lineHeight="1.6">
        Billing is only available to organization owners and admins. Contact an
        owner if you need subscription details.
      </Text>
    </Flex>
  );
}

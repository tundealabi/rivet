import { Box, Button, Flex, Heading, Skeleton, Text } from "@chakra-ui/react";
import { PiWarningCircle } from "react-icons/pi";
import { Link as RouterLink } from "react-router-dom";

import { scaleIn } from "../issues/issues-motion";
import { IssuesTableSkeleton } from "../issues/IssuesPageStates";

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, var(--chakra-colors-bg-surfaceHover) 0%, var(--chakra-colors-bg-surface) 50%, var(--chakra-colors-bg-surfaceHover) 100%)",
  backgroundSize: "200% 100%",
  animation: "rivet-shimmer 1.4s ease-in-out infinite",
};

function StatCardsSkeleton() {
  return (
    <Flex gap="3" overflowX="auto" pb="0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Box
          key={index}
          flex="1"
          minW={{ base: "28", sm: "0" }}
          px="4"
          py="3.5"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="control"
        >
          <Skeleton h="7" w="10" mb="2" css={shimmerStyle} />
          <Skeleton h="3" w="16" css={shimmerStyle} />
        </Box>
      ))}
    </Flex>
  );
}

function TabsSkeleton() {
  return (
    <Flex
      px={{ base: "5", md: "10" }}
      py="3"
      borderBottomWidth="1px"
      borderColor="border.default"
      bg="bg.surface"
      gap="6"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} h="4" w="16" css={shimmerStyle} />
      ))}
    </Flex>
  );
}

export function ProjectDetailLoadingSkeleton() {
  return (
    <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
      <Box
        px={{ base: "5", md: "10" }}
        py="5"
        borderBottomWidth="1px"
        borderColor="border.default"
        bg="bg.surface"
      >
        <Skeleton h="3" w="32" mb="4" css={shimmerStyle} />
        <Flex justify="space-between" align="flex-start" gap="5" mb="3">
          <Box flex="1">
            <Skeleton h="9" w="72" maxW="full" mb="3" css={shimmerStyle} />
            <Skeleton h="4" w="96" maxW="full" css={shimmerStyle} />
          </Box>
          <Skeleton h="9" w="28" borderRadius="full" css={shimmerStyle} />
        </Flex>
        <StatCardsSkeleton />
      </Box>

      <TabsSkeleton />

      <Flex
        justify="flex-end"
        px={{ base: "5", md: "10" }}
        py="3"
        borderBottomWidth="1px"
        borderColor="border.default"
        bg="bg.surface"
      >
        <Skeleton h="8" w="36" borderRadius="control" css={shimmerStyle} />
      </Flex>

      <Box
        px={{ base: "5", md: "10" }}
        py="3"
        borderBottomWidth="1px"
        borderColor="border.default"
        bg="bg.surface"
      >
        <Flex gap="2" flexWrap="wrap">
          <Skeleton h="9" w="44" borderRadius="control" css={shimmerStyle} />
          <Skeleton h="9" w="20" borderRadius="control" css={shimmerStyle} />
          <Skeleton h="9" w="20" borderRadius="control" css={shimmerStyle} />
          <Skeleton h="9" w="24" borderRadius="control" css={shimmerStyle} />
        </Flex>
      </Box>

      <Box flex="1" overflowY="auto" px={{ base: "5", md: "10" }} py="8">
        <IssuesTableSkeleton rows={6} flat />
      </Box>
    </Box>
  );
}

export function ProjectLoadErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="20"
      px="6"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      {...scaleIn}
    >
      <Flex
        boxSize="14"
        align="center"
        justify="center"
        borderRadius="full"
        bg="bg.surfaceHover"
        color="status.error"
        mb="4"
      >
        <PiWarningCircle size={28} />
      </Flex>
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="1">
        Couldn&apos;t load this project
      </Text>
      <Text
        fontSize="sm"
        color="fg.secondary"
        maxW="sm"
        mb="6"
        lineHeight="1.6"
      >
        Something went wrong fetching project data. Your work is still safe —
        try again.
      </Text>
      <Button
        variant="outline"
        size="sm"
        borderRadius="control"
        onClick={onRetry}
      >
        Retry
      </Button>
    </Flex>
  );
}

export function ProjectNotFoundState() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="24"
      px="6"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      {...scaleIn}
    >
      <Heading size="lg" color="fg.primary" mb="2" letterSpacing="-0.02em">
        Project not found
      </Heading>
      <Text
        fontSize="sm"
        color="fg.secondary"
        maxW="sm"
        mb="8"
        lineHeight="1.6"
      >
        The project you&apos;re looking for doesn&apos;t exist or may have been
        removed.
      </Text>
      <Button
        asChild
        borderRadius="control"
        bg="accent.default"
        color="white"
        fontWeight="semibold"
        _hover={{ bg: "accent.hover" }}
      >
        <RouterLink to="/projects">Back to projects</RouterLink>
      </Button>
    </Flex>
  );
}

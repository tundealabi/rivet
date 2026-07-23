import {
  Box,
  Button,
  Flex,
  Heading,
  Skeleton,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  PiBugBeetleDuotone,
  PiPlusBold,
  PiWarningCircle,
} from "react-icons/pi";

import { EASE_OUT, fadeInUp, scaleIn } from "./issues-motion";

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, var(--chakra-colors-bg-surfaceHover) 0%, var(--chakra-colors-bg-surface) 50%, var(--chakra-colors-bg-surfaceHover) 100%)",
  backgroundSize: "200% 100%",
  animation: "rivet-shimmer 1.4s ease-in-out infinite",
};

export function IssuesRefetchBar({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      right="0"
      h="2px"
      zIndex="20"
      overflow="hidden"
      bg="transparent"
    >
      <Box
        h="full"
        w="40%"
        bg="accent.default"
        borderRadius="full"
        opacity="0.9"
        animation="rivet-refetch 0.9s ease-in-out infinite"
      />
    </Box>
  );
}

export function IssuesTableSkeleton({
  rows = 8,
  flat = false,
}: {
  rows?: number;
  flat?: boolean;
}) {
  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      overflow="hidden"
      boxShadow={flat ? undefined : "card"}
      {...fadeInUp}
    >
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            {["", "28", "48", "32", "32", "24", "12", "16", "24"].map(
              (w, i) => (
                <Table.ColumnHeader key={i} w={w || undefined}>
                  <Skeleton h="3" w="full" maxW="20" css={shimmerStyle} />
                </Table.ColumnHeader>
              )
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: rows }).map((_, i) => (
            <Table.Row key={i}>
              <Table.Cell px="3">
                <Skeleton boxSize="4" borderRadius="sm" css={shimmerStyle} />
              </Table.Cell>
              <Table.Cell>
                <Skeleton h="3" w="14" css={shimmerStyle} />
              </Table.Cell>
              <Table.Cell>
                <Skeleton h="3" w="full" maxW="64" css={shimmerStyle} />
              </Table.Cell>
              <Table.Cell>
                <Skeleton
                  h="5"
                  w="20"
                  borderRadius="badge"
                  css={shimmerStyle}
                />
              </Table.Cell>
              <Table.Cell>
                <Skeleton
                  h="5"
                  w="24"
                  borderRadius="badge"
                  css={shimmerStyle}
                />
              </Table.Cell>
              <Table.Cell>
                <Skeleton
                  h="5"
                  w="16"
                  borderRadius="badge"
                  css={shimmerStyle}
                />
              </Table.Cell>
              <Table.Cell>
                <Skeleton
                  boxSize="6"
                  borderRadius="full"
                  mx="auto"
                  css={shimmerStyle}
                />
              </Table.Cell>
              <Table.Cell />
              <Table.Cell>
                <Skeleton h="3" w="10" ml="auto" css={shimmerStyle} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

export function IssuesErrorState({ onRetry }: { onRetry: () => void }) {
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
      boxShadow="card"
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
        animation={`rivet-scale-in 0.4s ${EASE_OUT} 0.1s both`}
      >
        <PiWarningCircle size={28} />
      </Flex>
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="1">
        Couldn't load issues
      </Text>
      <Text fontSize="sm" color="fg.secondary" maxW="sm" mb="6">
        Something went wrong fetching your issues. Your data is still safe — try
        again.
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

export function IssuesEmptyState({
  onCreate,
  canCreate,
}: {
  onCreate: () => void;
  canCreate: boolean;
}) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="24"
      px="6"
      borderWidth="1.5px"
      borderStyle="dashed"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      {...fadeInUp}
    >
      <Flex
        boxSize="20"
        align="center"
        justify="center"
        borderRadius="full"
        bg="brand.subtle"
        color="accent.default"
        mb="6"
        animation={`rivet-scale-in 0.5s ${EASE_OUT} 0.15s both`}
      >
        <PiBugBeetleDuotone size={40} />
      </Flex>
      <Heading size="lg" color="fg.primary" mb="2" letterSpacing="-0.02em">
        No issues yet
      </Heading>
      <Text
        fontSize="sm"
        color="fg.secondary"
        maxW="sm"
        mb="8"
        lineHeight="1.6"
      >
        Issues are where your team tracks, assigns, and ships work. Create your
        first issue to get started.
      </Text>
      {canCreate && (
        <Button
          size="lg"
          borderRadius="full"
          bg="accent.default"
          color="white"
          fontWeight="semibold"
          boxShadow="0 4px 14px rgba(79, 70, 229, 0.3)"
          _hover={{
            bg: "accent.hover",
            transform: "translateY(-2px)",
            boxShadow: "0 6px 20px rgba(79, 70, 229, 0.38)",
          }}
          _active={{ transform: "translateY(0)" }}
          transition="all 0.22s cubic-bezier(0.22, 1, 0.36, 1)"
          onClick={onCreate}
        >
          <PiPlusBold /> Create your first issue
        </Button>
      )}
    </Flex>
  );
}

export function ProjectIssuesEmptyState({
  onCreate,
  canCreate,
}: {
  onCreate: () => void;
  canCreate: boolean;
}) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="24"
      px="6"
      borderWidth="1.5px"
      borderStyle="dashed"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      {...fadeInUp}
    >
      <Flex
        boxSize="20"
        align="center"
        justify="center"
        borderRadius="full"
        bg="brand.subtle"
        color="accent.default"
        mb="6"
        animation={`rivet-scale-in 0.5s ${EASE_OUT} 0.15s both`}
      >
        <PiBugBeetleDuotone size={40} />
      </Flex>
      <Heading size="lg" color="fg.primary" mb="2" letterSpacing="-0.02em">
        No issues yet in this project
      </Heading>
      <Text
        fontSize="sm"
        color="fg.secondary"
        maxW="sm"
        mb="8"
        lineHeight="1.6"
      >
        This project is ready for work. Create the first issue to start tracking
        tasks, assignments, and progress here.
      </Text>
      {canCreate && (
        <Button
          size="lg"
          borderRadius="full"
          bg="accent.default"
          color="white"
          fontWeight="semibold"
          boxShadow="0 4px 14px rgba(79, 70, 229, 0.3)"
          _hover={{
            bg: "accent.hover",
            transform: "translateY(-2px)",
            boxShadow: "0 6px 20px rgba(79, 70, 229, 0.38)",
          }}
          _active={{ transform: "translateY(0)" }}
          transition="all 0.22s cubic-bezier(0.22, 1, 0.36, 1)"
          onClick={onCreate}
        >
          <PiPlusBold /> Create first issue
        </Button>
      )}
    </Flex>
  );
}

export function IssuesFilterEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="20"
      px="6"
      borderWidth="1.5px"
      borderStyle="dashed"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      {...scaleIn}
    >
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="1">
        No issues match these filters
      </Text>
      <Text fontSize="sm" color="fg.secondary" mb="4">
        Try adjusting your filters or clear them to see all issues.
      </Text>
      <Button
        variant="outline"
        size="sm"
        borderRadius="control"
        onClick={onClear}
      >
        Clear filters
      </Button>
    </Flex>
  );
}

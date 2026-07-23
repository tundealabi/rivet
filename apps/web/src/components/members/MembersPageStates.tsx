import {
  Box,
  Button,
  Flex,
  Heading,
  Skeleton,
  Table,
  Text,
} from "@chakra-ui/react";
import { PiPlusBold, PiUsersDuotone, PiWarningCircle } from "react-icons/pi";

import { EASE_OUT, fadeInUp, scaleIn } from "../issues/issues-motion";

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, var(--chakra-colors-bg-surfaceHover) 0%, var(--chakra-colors-bg-surface) 50%, var(--chakra-colors-bg-surfaceHover) 100%)",
  backgroundSize: "200% 100%",
  animation: "rivet-shimmer 1.4s ease-in-out infinite",
};

export function MembersTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      overflow="hidden"
      boxShadow="card"
      {...fadeInUp}
    >
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            {["40", "28", "20", "20", "16"].map((w, i) => (
              <Table.ColumnHeader key={i} w={w}>
                <Skeleton h="3" w="full" maxW="20" css={shimmerStyle} />
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: rows }).map((_, i) => (
            <Table.Row key={i}>
              <Table.Cell py="4" minH="16">
                <Flex align="center" gap="3">
                  <Skeleton
                    boxSize="8"
                    borderRadius="full"
                    css={shimmerStyle}
                  />
                  <Box flex="1">
                    <Skeleton h="3.5" w="32" mb="2" css={shimmerStyle} />
                    <Skeleton h="3" w="44" css={shimmerStyle} />
                  </Box>
                </Flex>
              </Table.Cell>
              <Table.Cell>
                <Skeleton
                  h="6"
                  w="16"
                  borderRadius="badge"
                  css={shimmerStyle}
                />
              </Table.Cell>
              <Table.Cell>
                <Skeleton h="3" w="20" css={shimmerStyle} />
              </Table.Cell>
              <Table.Cell>
                <Skeleton h="3" w="16" css={shimmerStyle} />
              </Table.Cell>
              <Table.Cell>
                <Skeleton
                  h="8"
                  w="8"
                  borderRadius="control"
                  css={shimmerStyle}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

export function MembersErrorState({ onRetry }: { onRetry: () => void }) {
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
        Couldn't load members
      </Heading>
      <Text fontSize="sm" color="fg.secondary" maxW="sm" mb="6">
        Something went wrong while fetching your team roster. Please try again.
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

export function MembersEmptyState({
  onInvite,
  canInvite,
}: {
  onInvite: () => void;
  canInvite: boolean;
}) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py="20"
      px="6"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      textAlign="center"
      {...fadeInUp}
    >
      <Flex
        boxSize="14"
        align="center"
        justify="center"
        borderRadius="full"
        bg="brand.subtle"
        color="accent.default"
        mb="4"
      >
        <PiUsersDuotone size={28} />
      </Flex>
      <Heading size="md" color="fg.primary" mb="2">
        No members yet
      </Heading>
      <Text fontSize="sm" color="fg.secondary" maxW="sm" mb="6">
        Invite teammates to collaborate on projects, assign issues, and mention
        each other in comments.
      </Text>
      {canInvite && (
        <Button
          borderRadius="full"
          bg="accent.default"
          color="white"
          fontWeight="semibold"
          _hover={{ bg: "accent.hover" }}
          onClick={onInvite}
        >
          <PiPlusBold />
          Invite member
        </Button>
      )}
    </Flex>
  );
}

export function MembersSoloBanner({
  onInvite,
  canInvite,
}: {
  onInvite: () => void;
  canInvite: boolean;
}) {
  return (
    <Flex
      align={{ base: "stretch", sm: "center" }}
      justify="space-between"
      direction={{ base: "column", sm: "row" }}
      gap="4"
      mt="4"
      px="5"
      py="4"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      boxShadow="card"
      {...fadeInUp}
    >
      <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
        You&apos;re the only one here — invite your team to get started
      </Text>
      {canInvite && (
        <Button
          borderRadius="full"
          bg="accent.default"
          color="white"
          fontWeight="semibold"
          flexShrink="0"
          _hover={{ bg: "accent.hover" }}
          onClick={onInvite}
        >
          <PiPlusBold />
          Invite member
        </Button>
      )}
    </Flex>
  );
}

export function MembersSearchEmptyState({ query }: { query: string }) {
  return (
    <Text fontSize="sm" color="fg.muted">
      No members match &lsquo;{query}&rsquo;
    </Text>
  );
}

export { EASE_OUT };

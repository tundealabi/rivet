import { Box, Flex, Text } from "@chakra-ui/react";

import type { ProjectStats } from "./project-stats";

interface StatCardProps {
  label: string;
  value: number;
  alert?: boolean;
}

function StatCard({ label, value, alert = false }: StatCardProps) {
  return (
    <Box
      flex="1"
      minW={{ base: "28", sm: "0" }}
      px="4"
      py="3.5"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="control"
      bg="transparent"
    >
      <Text
        fontSize="xl"
        fontWeight="semibold"
        color={alert ? "status.error" : "fg.primary"}
        letterSpacing="-0.03em"
        lineHeight="1.1"
      >
        {value}
      </Text>
      <Text fontSize="xs" color="fg.muted" mt="1">
        {label}
      </Text>
    </Box>
  );
}

export function ProjectStatStrip({
  stats,
  loading = false,
}: {
  stats: ProjectStats;
  loading?: boolean;
}) {
  if (loading) {
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
            bg="transparent"
          >
            <Box h="7" w="10" mb="2" bg="bg.surfaceHover" borderRadius="sm" />
            <Box h="3" w="16" bg="bg.surfaceHover" borderRadius="sm" />
          </Box>
        ))}
      </Flex>
    );
  }

  const items: StatCardProps[] = [
    { label: "Open", value: stats.open },
    { label: "In progress", value: stats.inProgress },
    { label: "Done this week", value: stats.doneThisWeek },
    { label: "Overdue", value: stats.overdue, alert: stats.overdue > 0 },
    { label: "Members", value: stats.members },
  ];

  return (
    <Flex
      gap="3"
      overflowX="auto"
      pb="0.5"
      css={{
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </Flex>
  );
}

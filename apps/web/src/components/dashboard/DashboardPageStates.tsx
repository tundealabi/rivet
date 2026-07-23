import {
  Box,
  Button,
  Flex,
  IconButton,
  SimpleGrid,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { PiArrowClockwise, PiFolderOpenDuotone } from "react-icons/pi";

import { EASE_OUT, fadeInUp } from "../issues/issues-motion";
import type { PulseStat } from "./dashboard-stats";
import type { IssueListPreset } from "./issue-list-presets";

export type DashboardStatCardKey =
  "open" | "in_progress" | "done_week" | "fourth";

const TREND_COLOR = {
  positive: "status.success",
  negative: "status.error",
  warning: "status.warning",
  neutral: "fg.muted",
} as const;

interface DashboardStatCardProps {
  stat: PulseStat;
  label: string;
  onClick: () => void;
  error?: boolean;
  retrying?: boolean;
  onRetry?: () => void;
}

export function DashboardStatCard({
  stat,
  label,
  onClick,
  error = false,
  retrying = false,
  onRetry,
}: DashboardStatCardProps) {
  const valueColor = error
    ? "fg.muted"
    : stat.alert
      ? "status.error"
      : "fg.primary";

  if (error) {
    return (
      <Box
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="card"
        px="5"
        py="4"
        {...fadeInUp}
      >
        <Flex align="center" justify="space-between" gap="2">
          <Text
            fontSize="3xl"
            fontWeight="700"
            color={valueColor}
            lineHeight="1"
            letterSpacing="-0.03em"
          >
            —
          </Text>
          {onRetry && (
            <IconButton
              aria-label={`Retry ${label}`}
              variant="ghost"
              size="xs"
              color="fg.muted"
              loading={retrying}
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              _hover={{ color: "accent.default", bg: "bg.surfaceHover" }}
            >
              <PiArrowClockwise size={14} />
            </IconButton>
          )}
        </Flex>
        <Text fontSize="sm" color="fg.secondary" mt="1.5">
          {label}
        </Text>
        <Text fontSize="xs" color="fg.muted" mt="1.5">
          Couldn&apos;t load
        </Text>
      </Box>
    );
  }

  return (
    <Button
      unstyled
      display="block"
      w="full"
      h="auto"
      textAlign="left"
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      px="5"
      py="4"
      cursor="pointer"
      transition="border-color 0.15s, background 0.15s"
      _hover={{ bg: "bg.surfaceHover", borderColor: "accent.default" }}
      onClick={onClick}
      {...fadeInUp}
    >
      <Text
        fontSize="3xl"
        fontWeight="700"
        color={valueColor}
        lineHeight="1"
        letterSpacing="-0.03em"
      >
        {stat.value}
      </Text>
      <Text fontSize="sm" color="fg.secondary" mt="1.5">
        {label}
      </Text>
      {stat.trend && (
        <Text
          fontSize="xs"
          color={TREND_COLOR[stat.trend.tone]}
          mt="2"
          fontWeight={stat.trend.tone === "warning" ? "medium" : "normal"}
        >
          {stat.trend.label}
        </Text>
      )}
    </Button>
  );
}

interface DashboardStatRowProps {
  stats: {
    open: PulseStat;
    inProgress: PulseStat;
    doneThisWeek: PulseStat;
    fourth: PulseStat;
    fourthLabel: string;
  };
  onNavigate: (preset: IssueListPreset) => void;
  failedCards?: Partial<Record<DashboardStatCardKey, boolean>>;
  retryingCards?: Partial<Record<DashboardStatCardKey, boolean>>;
  onRetryCard?: (key: DashboardStatCardKey) => void;
}

export function DashboardStatRow({
  stats,
  onNavigate,
  failedCards,
  retryingCards,
  onRetryCard,
}: DashboardStatRowProps) {
  return (
    <SimpleGrid columns={{ base: 2, lg: 4 }} gap="3">
      <DashboardStatCard
        stat={stats.open}
        label="Open issues"
        error={failedCards?.open}
        retrying={retryingCards?.open}
        onRetry={onRetryCard ? () => onRetryCard("open") : undefined}
        onClick={() => onNavigate("open")}
      />
      <DashboardStatCard
        stat={stats.inProgress}
        label="In progress"
        error={failedCards?.in_progress}
        retrying={retryingCards?.in_progress}
        onRetry={onRetryCard ? () => onRetryCard("in_progress") : undefined}
        onClick={() => onNavigate("in_progress")}
      />
      <DashboardStatCard
        stat={stats.doneThisWeek}
        label="Completed this week"
        error={failedCards?.done_week}
        retrying={retryingCards?.done_week}
        onRetry={onRetryCard ? () => onRetryCard("done_week") : undefined}
        onClick={() => onNavigate("done_week")}
      />
      <DashboardStatCard
        stat={stats.fourth}
        label={stats.fourthLabel}
        error={failedCards?.fourth}
        retrying={retryingCards?.fourth}
        onRetry={onRetryCard ? () => onRetryCard("fourth") : undefined}
        onClick={() =>
          onNavigate(
            stats.fourthLabel === "Assigned to me" ? "assigned_me" : "overdue"
          )
        }
      />
    </SimpleGrid>
  );
}

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, var(--chakra-colors-bg-surfaceHover) 0%, var(--chakra-colors-bg-surface) 50%, var(--chakra-colors-bg-surfaceHover) 100%)",
  backgroundSize: "200% 100%",
  animation: "rivet-shimmer 1.4s ease-in-out infinite",
};

export function DashboardStatRowSkeleton() {
  return (
    <SimpleGrid columns={{ base: 2, lg: 4 }} gap="3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Box
          key={index}
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="card"
          px="5"
          py="4"
          animation={`rivet-fade-in 0.35s ${EASE_OUT} both`}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <Skeleton h="9" w="12" css={shimmerStyle} />
          <Skeleton h="4" w="20" mt="3" css={shimmerStyle} />
          <Skeleton h="3" w="28" mt="2.5" css={shimmerStyle} />
        </Box>
      ))}
    </SimpleGrid>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <Box>
      <Skeleton h="10" w={{ base: "56", md: "72" }} css={shimmerStyle} />
      <Skeleton h="4" w={{ base: "48", md: "64" }} mt="2" css={shimmerStyle} />
    </Box>
  );
}

export function DashboardWelcomeEmptyState({
  firstName,
  onCreateProject,
}: {
  firstName: string;
  onCreateProject: () => void;
}) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py={{ base: "14", md: "20" }}
      px="6"
      minH={{ base: "420px", md: "480px" }}
      {...fadeInUp}
    >
      <Flex
        boxSize={{ base: "24", md: "28" }}
        align="center"
        justify="center"
        borderRadius="full"
        bg="dashboard.avatar.bg"
        color="dashboard.avatar.fg"
        mb="8"
      >
        <PiFolderOpenDuotone size={52} />
      </Flex>
      <Text
        fontSize={{ base: "2xl", md: "3xl" }}
        fontWeight="600"
        color="fg.primary"
        letterSpacing="-0.02em"
      >
        Welcome to Rivet, {firstName}!
      </Text>
      <Text
        fontSize="md"
        color="fg.secondary"
        mt="3"
        maxW="lg"
        lineHeight="1.6"
      >
        Create a project to start tracking issues and assigning work to your
        team.
      </Text>
      <Button
        mt="8"
        size="lg"
        px="6"
        py="3"
        h="auto"
        borderRadius="full"
        bg="accent.default"
        color="white"
        fontWeight="semibold"
        fontSize="md"
        _hover={{ bg: "accent.hover" }}
        onClick={onCreateProject}
      >
        Create your first project
      </Button>
    </Flex>
  );
}

export function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="16"
      px="6"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
    >
      <Text fontSize="lg" fontWeight="semibold" color="fg.primary">
        We&apos;re having trouble loading your dashboard.
      </Text>
      <Text fontSize="sm" color="fg.secondary" mt="2">
        Try again in a moment — your data is still safe.
      </Text>
      <Button
        mt="6"
        px="4"
        py="2"
        borderRadius="control"
        variant="outline"
        borderColor="border.default"
        bg="bg.surface"
        color="fg.primary"
        fontWeight="medium"
        fontSize="sm"
        _hover={{ bg: "bg.surfaceHover" }}
        onClick={onRetry}
      >
        Try again
      </Button>
    </Flex>
  );
}

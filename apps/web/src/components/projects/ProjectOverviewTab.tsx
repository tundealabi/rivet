import { Box, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { useMemo } from "react";

import type { Issue, TeamMember } from "../issues/issue-types";
import { formatDateLong } from "../issues/issue-types";
import { MarkdownContent } from "./MarkdownContent";
import {
  buildProjectActivity,
  buildProjectContributors,
  formatActivityLine,
} from "./project-activity";
import type { Project } from "./project-types";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="medium"
      color="fg.muted"
      textTransform="uppercase"
      letterSpacing="0.06em"
      mb="3"
    >
      {children}
    </Text>
  );
}

function MemberAvatar({
  initials,
  size = "8",
  title,
}: {
  initials: string;
  size?: string;
  title?: string;
}) {
  return (
    <Flex
      boxSize={size}
      align="center"
      justify="center"
      borderRadius="full"
      bg="brand.subtle"
      color="accent.default"
      fontSize="xs"
      fontWeight="bold"
      flexShrink="0"
      title={title}
    >
      {initials}
    </Flex>
  );
}

function ActivityTimeline({
  activities,
}: {
  activities: ReturnType<typeof buildProjectActivity>;
}) {
  if (activities.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted" fontStyle="italic">
        No activity yet — create an issue to get things moving.
      </Text>
    );
  }

  return (
    <Stack gap="0">
      {activities.map((item, index) => {
        const { lead, detail, time } = formatActivityLine(item);
        const isLast = index === activities.length - 1;

        return (
          <Flex key={item.id} gap="3" align="stretch">
            <Flex direction="column" align="center" w="8" flexShrink="0">
              <MemberAvatar initials={item.actorInitials} size="8" />
              {!isLast && (
                <Box
                  w="1px"
                  flex="1"
                  minH="6"
                  bg="border.default"
                  mt="2"
                  mb="1"
                />
              )}
            </Flex>

            <Box pb={isLast ? "0" : "5"} pt="0.5" minW="0">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                {lead}
                {detail ? (
                  <>
                    {" — "}
                    <Text as="span" color="fg.muted">
                      {detail}
                    </Text>
                  </>
                ) : null}
                <Text as="span" color="fg.muted">
                  {" · "}
                  {time}
                </Text>
              </Text>
            </Box>
          </Flex>
        );
      })}
    </Stack>
  );
}

function ContributorCluster({
  contributors,
}: {
  contributors: ReturnType<typeof buildProjectContributors>;
}) {
  if (contributors.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted" fontStyle="italic">
        No contributors yet.
      </Text>
    );
  }

  return (
    <HStack gap="0">
      {contributors.map((contributor, index) => (
        <Box
          key={contributor.name}
          ml={index === 0 ? "0" : "-2"}
          borderWidth="2px"
          borderColor="bg.canvas"
          borderRadius="full"
        >
          <MemberAvatar
            initials={contributor.initials}
            size="9"
            title={`${contributor.name} · ${contributor.issueCount} issue${contributor.issueCount === 1 ? "" : "s"}`}
          />
        </Box>
      ))}
    </HStack>
  );
}

interface ProjectOverviewTabProps {
  project: Project;
  issues: Issue[];
  teamMembers: TeamMember[];
}

export function ProjectOverviewTab({
  project,
  issues,
  teamMembers,
}: ProjectOverviewTabProps) {
  const activities = useMemo(() => buildProjectActivity(issues), [issues]);
  const contributors = useMemo(
    () => buildProjectContributors(issues, teamMembers),
    [issues, teamMembers]
  );

  return (
    <Box maxW="3xl">
      <Box mb="10">
        <SectionLabel>About</SectionLabel>
        {project.description.trim() ? (
          <MarkdownContent content={project.description} />
        ) : (
          <Text
            fontSize="md"
            color="fg.muted"
            fontStyle="italic"
            lineHeight="1.75"
          >
            No description yet. Add one from the project header to help your
            team understand what this project is about.
          </Text>
        )}
      </Box>

      <Box mb="10">
        <SectionLabel>Recent activity</SectionLabel>
        <ActivityTimeline activities={activities} />
      </Box>

      <Box mb="10">
        <SectionLabel>Contributors</SectionLabel>
        <ContributorCluster contributors={contributors} />
      </Box>

      <Box>
        <SectionLabel>Created</SectionLabel>
        <Text fontSize="sm" color="fg.secondary">
          by{" "}
          <Text as="span" fontWeight="medium" color="fg.primary">
            {project.createdBy}
          </Text>{" "}
          on {formatDateLong(project.createdAt)}
        </Text>
      </Box>
    </Box>
  );
}

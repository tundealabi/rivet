import { Box, Flex, HStack, Stack, Text } from "@chakra-ui/react";

import {
  formatProjectIssueKey,
  type Issue,
  PRIORITY_DOT_COLOR,
  STATUS_DOT_COLOR,
} from "../issues/issue-types";
import { STATUS_OPTIONS } from "../issues/IssueFilterBar";
import { formatIssueDueLabel, isIssueDueOverdue } from "./dashboard-content";
import {
  DashboardMetaItem,
  DashboardMetaLine,
  DashboardRowDivider,
  DashboardSection,
  DashboardSectionEmpty,
  DashboardSectionHeader,
} from "./DashboardSectionHeader";
import { issuesPathForPreset } from "./issue-list-presets";

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label])
);

interface DashboardMyIssuesSectionProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onBrowseOpen: () => void;
  onBrowseProjects?: () => void;
  suggestBrowseProjects?: boolean;
}

export function DashboardMyIssuesSection({
  issues,
  onIssueClick,
  onBrowseOpen,
  onBrowseProjects,
  suggestBrowseProjects = false,
}: DashboardMyIssuesSectionProps) {
  const rows = issues.slice(0, 8);

  return (
    <DashboardSection>
      <DashboardSectionHeader
        title="My issues"
        viewAllHref={issuesPathForPreset("assigned_me")}
      />

      {rows.length === 0 ? (
        <DashboardSectionEmpty
          message={
            suggestBrowseProjects
              ? "Nothing assigned to you yet — there's already work happening in this org."
              : "Nothing assigned to you right now."
          }
          secondaryActionLabel={
            suggestBrowseProjects ? "Browse projects →" : "Browse open issues →"
          }
          onSecondaryAction={
            suggestBrowseProjects ? onBrowseProjects : onBrowseOpen
          }
        />
      ) : (
        <Stack gap="0">
          {rows.map((issue, index) => {
            const dueLabel = formatIssueDueLabel(issue);
            const overdue = isIssueDueOverdue(issue);

            return (
              <Box key={issue.id}>
                {index > 0 && <DashboardRowDivider />}
                <Box
                  py="3.5"
                  cursor="pointer"
                  borderRadius="control"
                  mx={{ base: "-2", md: "-3" }}
                  px={{ base: "2", md: "3" }}
                  transition="background 0.15s"
                  _hover={{ bg: "bg.surfaceHover" }}
                  onClick={() => onIssueClick(issue)}
                >
                  <Flex align="baseline" gap="2" minW="0">
                    <Text
                      fontSize="xs"
                      fontFamily="mono"
                      color="fg.muted"
                      fontWeight="medium"
                      flexShrink="0"
                    >
                      {formatProjectIssueKey(issue)}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="fg.primary"
                      fontWeight="medium"
                      truncate
                      flex="1"
                      minW="0"
                    >
                      {issue.title}
                    </Text>
                  </Flex>
                  <DashboardMetaLine>
                    <HStack gap="1" flexShrink="0">
                      <Box
                        boxSize="1.5"
                        borderRadius="full"
                        bg={STATUS_DOT_COLOR[issue.status]}
                      />
                      <DashboardMetaItem color="fg.secondary">
                        {STATUS_LABELS[issue.status]}
                      </DashboardMetaItem>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      ·
                    </Text>
                    <DashboardMetaItem>{issue.projectKey}</DashboardMetaItem>
                    <Text fontSize="xs" color="fg.muted">
                      ·
                    </Text>
                    <Box
                      boxSize="1.5"
                      borderRadius="full"
                      bg={PRIORITY_DOT_COLOR[issue.priority]}
                      flexShrink="0"
                      title={issue.priority}
                    />
                    {dueLabel && (
                      <>
                        <Text fontSize="xs" color="fg.muted">
                          ·
                        </Text>
                        <DashboardMetaItem
                          color={overdue ? "status.error" : "fg.muted"}
                        >
                          {dueLabel}
                        </DashboardMetaItem>
                      </>
                    )}
                  </DashboardMetaLine>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </DashboardSection>
  );
}

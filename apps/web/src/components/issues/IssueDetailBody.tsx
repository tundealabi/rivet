import { Box, Flex } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useRegisterIssueDetailShortcuts } from "./issue-detail-shortcuts";
import type { Issue, IssueActivityEvent, TeamMember } from "./issue-types";
import { ISSUE_DETAIL_PAGE_MAX_W } from "./issue-types";
import { buildTimeline, IssueActivityThread } from "./IssueActivityThread";
import { IssueCommentComposer } from "./IssueCommentComposer";
import { IssueDescriptionSection } from "./IssueDescriptionSection";
import type { IssueDetailVariant } from "./IssueDetailContent";
import { IssueMetadataSidebar } from "./IssueMetadataSidebar";

interface IssueDetailBodyProps {
  issue: Issue;
  variant: IssueDetailVariant;
  role: OrganizationRole;
  currentUser: string;
  editable: boolean;
  canComment: boolean;
  teamMembers: TeamMember[];
  projectIssues: Pick<Issue, "id" | "projectKey" | "number" | "title">[];
  onUpdate: (id: string, patch: Partial<Issue>) => void;
  onAddComment: (issueId: string, body: string) => Promise<void>;
  onAddActivity: (issueId: string, event: IssueActivityEvent) => void;
  onEditComment: (issueId: string, commentId: string, body: string) => void;
  onDeleteComment: (issueId: string, commentId: string) => void;
  onToggleReaction: (issueId: string, commentId: string, emoji: string) => void;
  onNavigateToProject?: () => void;
  registerShortcuts?: boolean;
}

export function IssueDetailBody({
  issue,
  variant,
  role,
  currentUser,
  editable,
  canComment,
  teamMembers,
  projectIssues,
  onUpdate,
  onAddComment,
  onAddActivity,
  onEditComment,
  onDeleteComment,
  onToggleReaction,
  onNavigateToProject,
  registerShortcuts = false,
}: IssueDetailBodyProps) {
  const [watching, setWatching] = useState(
    issue.watchers.includes(currentUser)
  );
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [priorityPickerOpen, setPriorityPickerOpen] = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);

  const pickerOpen = useMemo(
    () => ({
      status: {
        open: statusPickerOpen,
        onOpenChange: setStatusPickerOpen,
      },
      priority: {
        open: priorityPickerOpen,
        onOpenChange: setPriorityPickerOpen,
      },
      assignee: {
        open: assigneePickerOpen,
        onOpenChange: setAssigneePickerOpen,
      },
    }),
    [assigneePickerOpen, priorityPickerOpen, statusPickerOpen]
  );

  const openStatusPicker = useCallback(() => {
    if (editable) setStatusPickerOpen(true);
  }, [editable]);

  const openPriorityPicker = useCallback(() => {
    if (editable) setPriorityPickerOpen(true);
  }, [editable]);

  const openAssigneePicker = useCallback(() => {
    if (editable) setAssigneePickerOpen(true);
  }, [editable]);

  useRegisterIssueDetailShortcuts(
    registerShortcuts && editable
      ? {
          openStatusPicker,
          openPriorityPicker,
          openAssigneePicker,
        }
      : {}
  );

  const timeline = useMemo(
    () => buildTimeline(issue.activity, issue.comments),
    [issue.activity, issue.comments]
  );

  const toggleWatch = () => {
    setWatching((prev) => !prev);
    toast.success(watching ? "Unwatching issue" : "Watching issue");
  };

  const isPage = variant === "page";
  const px = isPage ? { base: "5", md: "10" } : "6";

  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      flex="1"
      minH="0"
      maxW={isPage ? ISSUE_DETAIL_PAGE_MAX_W : undefined}
      mx={isPage ? "auto" : undefined}
      w="full"
    >
      {/* Mobile metadata — collapsible on top */}
      <Box display={{ base: "block", lg: "none" }} w="full" flexShrink="0">
        <IssueMetadataSidebar
          issue={issue}
          editable={editable}
          currentUser={currentUser}
          teamMembers={teamMembers}
          watching={watching}
          onUpdate={onUpdate}
          onAddActivity={onAddActivity}
          onToggleWatch={toggleWatch}
          onNavigateToProject={onNavigateToProject}
          collapsible
          pickerOpen={pickerOpen}
        />
      </Box>

      {/* Main column ~65% */}
      <Flex
        direction="column"
        flex={{ base: "1", lg: "0 0 65%" }}
        minW="0"
        px={px}
        py="5"
        borderRightWidth={{ lg: "1px" }}
        borderColor="border.divider"
      >
        <IssueDescriptionSection
          issue={issue}
          editable={editable}
          teamMembers={teamMembers}
          projectIssues={projectIssues}
          onUpdate={onUpdate}
          registerShortcuts={registerShortcuts}
        />

        <Box mt="8" flex="1" minH="0">
          <IssueActivityThread
            items={timeline}
            role={role}
            currentUser={currentUser}
            onEditComment={(commentId, body) =>
              onEditComment(issue.id, commentId, body)
            }
            onDeleteComment={(commentId) =>
              onDeleteComment(issue.id, commentId)
            }
            onToggleReaction={(commentId, emoji) =>
              onToggleReaction(issue.id, commentId, emoji)
            }
          />
        </Box>

        {canComment && (
          <IssueCommentComposer
            issueId={issue.id}
            teamMembers={teamMembers}
            projectIssues={projectIssues}
            onSubmit={(body) => onAddComment(issue.id, body)}
            registerShortcuts={registerShortcuts}
          />
        )}
      </Flex>

      {/* Sidebar ~35% — desktop */}
      <Box
        display={{ base: "none", lg: "block" }}
        flex="0 0 35%"
        minW="0"
        overflowY="auto"
      >
        <IssueMetadataSidebar
          issue={issue}
          editable={editable}
          currentUser={currentUser}
          teamMembers={teamMembers}
          watching={watching}
          onUpdate={onUpdate}
          onAddActivity={onAddActivity}
          onToggleWatch={toggleWatch}
          onNavigateToProject={onNavigateToProject}
          pickerOpen={pickerOpen}
        />
      </Box>
    </Flex>
  );
}

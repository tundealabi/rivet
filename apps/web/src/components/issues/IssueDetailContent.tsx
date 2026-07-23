import { Box, Button, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import toast from "react-hot-toast";
import { PiArrowsIn, PiTrash, PiX } from "react-icons/pi";

import {
  IssueDetailKeyboardShortcuts,
  IssueDetailShortcutsProvider,
  IssueShortcutsDialog,
} from "./issue-detail-shortcuts";
import {
  canCommentOnIssue,
  canDeleteIssue,
  canEditIssue,
} from "./issue-permissions";
import {
  DEFAULT_REACTIONS,
  formatProjectIssueKey,
  type Issue,
  ISSUE_DETAIL_PAGE_MAX_W,
  type IssueActivityEvent,
  type IssueComment,
  memberByName,
  type TeamMember,
} from "./issue-types";
import { IssueDetailBody } from "./IssueDetailBody";
import { IssueDetailDrawerFooter } from "./IssueDetailDrawerFooter";
import { IssueDetailDrawerStrip } from "./IssueDetailDrawerStrip";
import { IssueDetailTitleBlock } from "./IssueDetailTitleBlock";

export type IssueDetailVariant = "drawer" | "page";

interface IssueDetailContentProps {
  issue: Issue;
  variant: IssueDetailVariant;
  role: OrganizationRole;
  currentUser: string;
  teamMembers: TeamMember[];
  projectIssues: Pick<Issue, "id" | "projectKey" | "number" | "title">[];
  onUpdate: (id: string, patch: Partial<Issue>) => void;
  onAddComment: (issueId: string, body: string) => Promise<void>;
  onAddActivity: (issueId: string, event: IssueActivityEvent) => void;
  onEditComment: (issueId: string, commentId: string, body: string) => void;
  onDeleteComment: (issueId: string, commentId: string) => void;
  onToggleReaction: (issueId: string, commentId: string, emoji: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  onNavigateToProject?: () => void;
  navigableIssueIds?: string[];
  onNavigateToIssue?: (issueId: string) => void;
}

export function IssueDetailContent({
  issue,
  variant,
  role,
  currentUser,
  teamMembers,
  projectIssues,
  onUpdate,
  onAddComment,
  onAddActivity,
  onEditComment,
  onDeleteComment,
  onToggleReaction,
  onDelete,
  onClose,
  onExpand,
  onCollapse,
  onNavigateToProject,
  navigableIssueIds,
  onNavigateToIssue,
}: IssueDetailContentProps) {
  const editable = canEditIssue(role, issue, currentUser);
  const canComment = canCommentOnIssue(role);
  const deletable = canDeleteIssue(role);

  const isPage = variant === "page";
  const issueKey = formatProjectIssueKey(issue);

  const titleBlock = (
    <>
      {isPage && (
        <Box
          px={{ base: "5", md: "10" }}
          pt={{ base: "5", md: "6" }}
          pb="0"
          borderBottomWidth="1px"
          borderColor="border.default"
          maxW={ISSUE_DETAIL_PAGE_MAX_W}
          mx="auto"
          w="full"
        >
          <Flex align="center" justify="space-between" mb="3" gap="2">
            <HStack gap="2" minW="0">
              <Box
                boxSize="2.5"
                borderRadius="sm"
                bg={issue.projectColor}
                flexShrink="0"
              />
              <Text fontSize="xs" fontFamily="mono" color="fg.muted">
                {issueKey}
              </Text>
            </HStack>

            <HStack gap="1" flexShrink="0">
              {onCollapse && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Collapse to drawer"
                  color="fg.muted"
                  _hover={{ color: "fg.primary", bg: "bg.surfaceHover" }}
                  onClick={onCollapse}
                >
                  <PiArrowsIn size={18} />
                </IconButton>
              )}
              {onClose && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Close issue detail"
                  color="fg.muted"
                  _hover={{ color: "fg.primary", bg: "bg.surfaceHover" }}
                  onClick={onClose}
                >
                  <PiX size={20} />
                </IconButton>
              )}
            </HStack>
          </Flex>
        </Box>
      )}

      <IssueDetailTitleBlock
        issue={issue}
        editable={editable}
        variant={variant}
        onUpdate={onUpdate}
      />
    </>
  );

  return (
    <IssueDetailShortcutsProvider>
      <Flex
        direction="column"
        h={isPage ? "auto" : "full"}
        minH={isPage ? "100svh" : undefined}
        bg="bg.surface"
      >
        {!isPage && onClose && onExpand && onNavigateToProject && (
          <IssueDetailDrawerStrip
            issue={issue}
            onClose={onClose}
            onExpand={onExpand}
            onNavigateToProject={onNavigateToProject}
            deletable={deletable}
            onDelete={() => onDelete(issue.id)}
          />
        )}

        {!isPage ? (
          <Box
            flex="1"
            overflowY="auto"
            minH="0"
            display="flex"
            flexDirection="column"
          >
            {titleBlock}
            <IssueDetailBody
              issue={issue}
              variant={variant}
              role={role}
              currentUser={currentUser}
              editable={editable}
              canComment={canComment}
              teamMembers={teamMembers}
              projectIssues={projectIssues}
              onUpdate={onUpdate}
              onAddComment={onAddComment}
              onAddActivity={onAddActivity}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              onToggleReaction={onToggleReaction}
              onNavigateToProject={onNavigateToProject}
              registerShortcuts
            />
          </Box>
        ) : (
          <>
            {titleBlock}
            <IssueDetailBody
              issue={issue}
              variant={variant}
              role={role}
              currentUser={currentUser}
              editable={editable}
              canComment={canComment}
              teamMembers={teamMembers}
              projectIssues={projectIssues}
              onUpdate={onUpdate}
              onAddComment={onAddComment}
              onAddActivity={onAddActivity}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              onToggleReaction={onToggleReaction}
              onNavigateToProject={onNavigateToProject}
            />
            {deletable && (
              <Box
                px={{ base: "5", md: "10" }}
                py="6"
                maxW={ISSUE_DETAIL_PAGE_MAX_W}
                mx="auto"
                w="full"
              >
                <Button
                  variant="outline"
                  size="sm"
                  borderRadius="control"
                  borderColor="status.error"
                  color="status.error"
                  _hover={{ bg: "danger.ghostHover" }}
                  onClick={() => {
                    onDelete(issue.id);
                    toast.success("Issue deleted");
                  }}
                >
                  <PiTrash size={16} />
                  Delete issue
                </Button>
              </Box>
            )}
          </>
        )}

        {!isPage && (
          <IssueDetailDrawerFooter
            issue={issue}
            deletable={deletable}
            onDelete={() => onDelete(issue.id)}
          />
        )}

        <IssueShortcutsDialog />
        <IssueDetailKeyboardShortcuts
          issueId={issue.id}
          variant={variant}
          enabled={!isPage}
          onClose={onClose}
          navigableIssueIds={navigableIssueIds}
          onNavigateToIssue={onNavigateToIssue}
        />
      </Flex>
    </IssueDetailShortcutsProvider>
  );
}

/** Shared issue detail mutation helpers for list/detail state. */
export function applyIssueCommentAdd(
  issue: Issue,
  body: string,
  currentUser: string,
  teamMembers: TeamMember[],
  options?: { id?: string; syncStatus?: IssueComment["syncStatus"] }
): Issue {
  const member = memberByName(teamMembers, currentUser);
  const comment: IssueComment = {
    id: options?.id ?? crypto.randomUUID(),
    author: currentUser,
    authorInitials: member?.initials ?? "??",
    body,
    createdAt: new Date(),
    reactions: DEFAULT_REACTIONS.map((emoji) => ({
      emoji,
      count: 0,
      reactedByMe: false,
    })),
    syncStatus: options?.syncStatus,
  };
  const comments = [...issue.comments, comment];
  return {
    ...issue,
    comments,
    commentCount: comments.length,
    updatedAt: new Date(),
  };
}

export function applyIssueActivityAdd(
  issue: Issue,
  event: IssueActivityEvent
): Issue {
  return {
    ...issue,
    activity: [...issue.activity, event],
    updatedAt: new Date(),
  };
}

export function applyIssueCommentEdit(
  issue: Issue,
  commentId: string,
  body: string
): Issue {
  return {
    ...issue,
    comments: issue.comments.map((c) =>
      c.id === commentId ? { ...c, body } : c
    ),
    updatedAt: new Date(),
  };
}

export function applyIssueCommentDelete(
  issue: Issue,
  commentId: string
): Issue {
  const comments = issue.comments.filter((c) => c.id !== commentId);
  return {
    ...issue,
    comments,
    commentCount: comments.length,
    updatedAt: new Date(),
  };
}

export function applyIssueReactionToggle(
  issue: Issue,
  commentId: string,
  emoji: string
): Issue {
  return {
    ...issue,
    comments: issue.comments.map((comment) => {
      if (comment.id !== commentId) return comment;
      const reactions = comment.reactions.map((reaction) => {
        if (reaction.emoji !== emoji) return reaction;
        if (reaction.reactedByMe) {
          return {
            ...reaction,
            count: Math.max(0, reaction.count - 1),
            reactedByMe: false,
          };
        }
        return {
          ...reaction,
          count: reaction.count + 1,
          reactedByMe: true,
        };
      });
      return { ...comment, reactions };
    }),
  };
}

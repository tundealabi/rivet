import {
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useState } from "react";
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
  formatProjectIssueKey,
  type Issue,
  ISSUE_DETAIL_PAGE_MAX_W,
  type IssueActivityEvent,
  type TeamMember,
} from "./issue-types";
import { IssueDetailBody } from "./IssueDetailBody";
import { IssueDetailDrawerFooter } from "./IssueDetailDrawerFooter";
import { IssueDetailDrawerStrip } from "./IssueDetailDrawerStrip";
import { IssueDetailTitleBlock } from "./IssueDetailTitleBlock";
import { EASE_OUT } from "./issues-motion";

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
  onDelete: (id: string) => void | Promise<void>;
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await onDelete(issue.id);
      setDeleteOpen(false);
    } catch {
      // Page handler already surfaced the error.
    } finally {
      setDeleting(false);
    }
  };

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
              <Text
                fontSize="xs"
                fontFamily="mono"
                fontWeight="bold"
                color="accent.default"
              >
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
                  onClick={() => setDeleteOpen(true)}
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

      {isPage && (
        <Dialog.Root
          open={deleteOpen}
          onOpenChange={(e) => {
            if (!e.open && deleting) return;
            setDeleteOpen(e.open);
          }}
          placement="center"
        >
          <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="bg.surface"
              borderRadius="card"
              maxW="sm"
              w="full"
              mx="4"
              boxShadow="elevated"
              animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
            >
              <Dialog.Header pt="6" px="6" pb="0">
                <Dialog.Title color="fg.primary">
                  Delete {issueKey}?
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body px="6" py="4">
                <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                  This cannot be undone.
                </Text>
              </Dialog.Body>
              <Dialog.Footer px="6" pb="6" pt="0" gap="3">
                <Button
                  variant="outline"
                  borderRadius="control"
                  disabled={deleting}
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  borderRadius="control"
                  bg="status.error"
                  color="white"
                  loading={deleting}
                  _hover={{ bg: "red.600" }}
                  onClick={() => {
                    void confirmDelete();
                  }}
                >
                  Delete issue
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      )}
    </IssueDetailShortcutsProvider>
  );
}

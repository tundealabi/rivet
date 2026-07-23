import { Drawer } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";

import type { Issue, IssueActivityEvent, TeamMember } from "./issue-types";
import { IssueDetailContent } from "./IssueDetailContent";

interface IssueDetailDrawerProps {
  issue: Issue;
  open: boolean;
  onClose: () => void;
  onExpand: () => void;
  onNavigateToProject: () => void;
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
  navigableIssueIds?: string[];
  onNavigateToIssue?: (issueId: string) => void;
}

export function IssueDetailDrawer({
  issue,
  open,
  onClose,
  onExpand,
  onNavigateToProject,
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
  navigableIssueIds,
  onNavigateToIssue,
}: IssueDetailDrawerProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      placement="end"
    >
      <Drawer.Backdrop bg="blackAlpha.500" backdropFilter="blur(3px)" />
      <Drawer.Positioner>
        <Drawer.Content
          bg="bg.surface"
          w={{ base: "full", md: "580px" }}
          maxW={{ md: "640px" }}
          minW={{ md: "560px" }}
          display="flex"
          flexDirection="column"
          boxShadow="drawerLift"
        >
          <IssueDetailContent
            issue={issue}
            variant="drawer"
            role={role}
            currentUser={currentUser}
            teamMembers={teamMembers}
            projectIssues={projectIssues}
            onUpdate={onUpdate}
            onAddComment={onAddComment}
            onAddActivity={onAddActivity}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            onToggleReaction={onToggleReaction}
            onDelete={(id) => {
              onDelete(id);
              onClose();
            }}
            onClose={onClose}
            onExpand={onExpand}
            onNavigateToProject={onNavigateToProject}
            navigableIssueIds={navigableIssueIds}
            onNavigateToIssue={onNavigateToIssue}
          />
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}

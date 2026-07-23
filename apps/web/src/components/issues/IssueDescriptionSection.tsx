import { Box, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

import { useRegisterIssueDetailShortcuts } from "./issue-detail-shortcuts";
import type { Issue, TeamMember } from "./issue-types";
import { IssueMarkdown } from "./IssueMarkdown";
import { IssueConflictError, updateIssuePatchMock } from "./issues-api";
import { transition } from "./issues-motion";
import {
  clearMarkdownDraft,
  MarkdownEditorActions,
  MarkdownEditorHint,
  MarkdownTextarea,
} from "./MarkdownTextarea";

interface IssueDescriptionSectionProps {
  issue: Issue;
  editable: boolean;
  teamMembers: TeamMember[];
  projectIssues: Pick<Issue, "id" | "projectKey" | "number" | "title">[];
  onUpdate: (id: string, patch: Partial<Issue>) => void;
  registerShortcuts?: boolean;
}

export function IssueDescriptionSection({
  issue,
  editable,
  teamMembers,
  projectIssues,
  onUpdate,
  registerShortcuts = false,
}: IssueDescriptionSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(issue.description);
  const [conflict, setConflict] = useState(false);
  const draftKey = `desc:${issue.id}`;

  useEffect(() => {
    setDraft(issue.description);
    setEditing(false);
    setConflict(false);
  }, [issue.id, issue.description]);

  const startEditing = useCallback(() => {
    if (editable) setEditing(true);
  }, [editable]);

  useRegisterIssueDetailShortcuts(
    registerShortcuts && editable ? { editDescription: startEditing } : {}
  );

  const cancel = () => {
    setDraft(issue.description);
    setEditing(false);
  };

  const save = () => {
    if (draft === issue.description) {
      setEditing(false);
      clearMarkdownDraft(draftKey);
      return;
    }

    const rollback = issue.description;
    setConflict(false);
    onUpdate(issue.id, { description: draft, updatedAt: new Date() });
    setEditing(false);
    clearMarkdownDraft(draftKey);

    void (async () => {
      try {
        await updateIssuePatchMock(issue.id, { description: draft });
      } catch (error) {
        if (error instanceof IssueConflictError) {
          setConflict(true);
          setEditing(true);
          onUpdate(issue.id, { description: rollback, updatedAt: new Date() });
          return;
        }
        onUpdate(issue.id, { description: rollback, updatedAt: new Date() });
      }
    })();
  };

  return (
    <Box>
      {conflict && (
        <Box
          mb="3"
          px="3"
          py="2.5"
          borderRadius="control"
          bg="danger.ghostHover"
          borderWidth="1px"
          borderColor="red.100"
          _dark={{ bg: "whiteAlpha.100", borderColor: "whiteAlpha.200" }}
        >
          <Text fontSize="sm" color="status.error" lineHeight="1.5">
            This issue was updated by someone else. Review their changes before
            saving again.
          </Text>
        </Box>
      )}

      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="0.04em"
        mb="3"
      >
        Description
      </Text>

      {editable && editing ? (
        <Box>
          <MarkdownTextarea
            value={draft}
            onChange={setDraft}
            teamMembers={teamMembers}
            projectIssues={projectIssues}
            draftKey={draftKey}
            autoFocus
            rows={8}
          />
          <MarkdownEditorHint />
          <MarkdownEditorActions onSave={save} onCancel={cancel} />
        </Box>
      ) : issue.description ? (
        <Box
          cursor={editable ? "pointer" : "default"}
          onClick={() => editable && startEditing()}
          transition={transition.base}
          _hover={
            editable
              ? {
                  bg: "bg.surfaceHover",
                  borderRadius: "control",
                  mx: "-2",
                  px: "2",
                  py: "2",
                }
              : undefined
          }
        >
          <IssueMarkdown content={issue.description} />
        </Box>
      ) : (
        <Text
          fontSize="sm"
          color="fg.muted"
          cursor={editable ? "pointer" : "default"}
          onClick={() => editable && startEditing()}
          _hover={editable ? { color: "fg.secondary" } : undefined}
        >
          Add a description…
        </Text>
      )}
    </Box>
  );
}

import { Box, Button, Stack } from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";

import { useRegisterIssueDetailShortcuts } from "./issue-detail-shortcuts-context";
import type { Issue, TeamMember } from "./issue-types";
import { clearMarkdownDraft } from "./markdown-draft";
import { MarkdownEditorHint, MarkdownTextarea } from "./MarkdownTextarea";

interface IssueCommentComposerProps {
  issueId: string;
  teamMembers: TeamMember[];
  projectIssues: Pick<Issue, "id" | "projectKey" | "number" | "title">[];
  onSubmit: (body: string) => Promise<void>;
  registerShortcuts?: boolean;
}

export function IssueCommentComposer({
  issueId,
  teamMembers,
  projectIssues,
  onSubmit,
  registerShortcuts = false,
}: IssueCommentComposerProps) {
  const [draft, setDraft] = useState("");
  const draftKey = `comment:${issueId}`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(async () => {
    const body = draft.trim();
    if (!body) return;
    const saved = body;
    setDraft("");
    clearMarkdownDraft(draftKey);
    try {
      await onSubmit(saved);
    } catch {
      setDraft(saved);
    }
  }, [draft, draftKey, onSubmit]);

  const focusComment = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  useRegisterIssueDetailShortcuts(
    registerShortcuts
      ? {
          focusComment,
          submitComment: () => {
            void submit();
          },
        }
      : {}
  );

  return (
    <Box
      position="sticky"
      bottom="0"
      bg="bg.surface"
      borderTopWidth="1px"
      borderColor="border.default"
      pt="4"
      pb="1"
      mt="4"
      zIndex="1"
    >
      <Stack gap="3">
        <MarkdownTextarea
          value={draft}
          onChange={setDraft}
          placeholder="Write a comment…"
          teamMembers={teamMembers}
          projectIssues={projectIssues}
          draftKey={draftKey}
          rows={3}
          inputRef={textareaRef}
        />
        <MarkdownEditorHint />
        <Box display="flex" justifyContent="flex-end">
          <Button
            size="sm"
            borderRadius="control"
            bg="accent.default"
            color="white"
            _hover={{ bg: "accent.hover" }}
            disabled={!draft.trim()}
            onClick={() => {
              void submit();
            }}
          >
            Comment
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

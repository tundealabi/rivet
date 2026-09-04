import { Box, Flex, HStack, Input, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useActiveOrg } from "../billing/use-active-org";
import {
  formatRelativeTime,
  type Issue,
  ISSUE_DETAIL_PAGE_MAX_W,
} from "./issue-types";
import { issueFieldsFromUpdate } from "./issues-api";
import { useUpdateIssueMutation } from "./use-issues-queries";

const TITLE_COLOR = "#111111";
const TITLE_SIZE = "26px";

interface IssueDetailTitleBlockProps {
  issue: Issue;
  editable: boolean;
  variant: "drawer" | "page";
  onUpdate: (id: string, patch: Partial<Issue>) => void;
}

function ReporterAvatar({ initials }: { initials: string }) {
  return (
    <Flex
      boxSize="5"
      align="center"
      justify="center"
      borderRadius="full"
      bg="brand.subtle"
      color="accent.default"
      fontSize="2xs"
      fontWeight="bold"
      flexShrink="0"
    >
      {initials}
    </Flex>
  );
}

export function IssueDetailTitleBlock({
  issue,
  editable,
  variant,
  onUpdate,
}: IssueDetailTitleBlockProps) {
  const { orgId } = useActiveOrg();
  const updateMutation = useUpdateIssueMutation(orgId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(issue.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const [synced, setSynced] = useState({ id: issue.id, title: issue.title });
  if (synced.id !== issue.id || synced.title !== issue.title) {
    setSynced({ id: issue.id, title: issue.title });
    setDraft(issue.title);
    setEditing(false);
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const cancel = () => {
    setDraft(issue.title);
    setEditing(false);
  };

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      cancel();
      return;
    }
    if (trimmed === issue.title) {
      setEditing(false);
      return;
    }

    const rollback = issue.title;
    onUpdate(issue.id, { title: trimmed, updatedAt: new Date() });
    setEditing(false);

    void (async () => {
      try {
        const updated = await updateMutation.mutateAsync({
          issueId: issue.id,
          input: { title: trimmed },
        });
        onUpdate(issue.id, issueFieldsFromUpdate(updated));
      } catch {
        onUpdate(issue.id, { title: rollback, updatedAt: new Date() });
        toast.error("Couldn't update title — please try again");
      }
    })();
  };

  const isDrawer = variant === "drawer";

  return (
    <Box
      px={isDrawer ? "6" : { base: "5", md: "10" }}
      pt={isDrawer ? "5" : { base: "6", md: "7" }}
      pb={isDrawer ? "3" : "6"}
      flexShrink="0"
      maxW={isDrawer ? undefined : ISSUE_DETAIL_PAGE_MAX_W}
      mx={isDrawer ? undefined : "auto"}
      w="full"
    >
      {editable && editing ? (
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          variant="flushed"
          fontSize={TITLE_SIZE}
          fontWeight="600"
          color={TITLE_COLOR}
          lineHeight="1.35"
          letterSpacing="-0.02em"
          px="0"
          mb="3"
          borderColor="border.default"
          _focus={{
            borderColor: "accent.default",
            boxShadow: "none",
          }}
        />
      ) : (
        <Text
          fontSize={TITLE_SIZE}
          fontWeight="600"
          color={TITLE_COLOR}
          lineHeight="1.35"
          letterSpacing="-0.02em"
          mb="3"
          cursor={editable ? "text" : "default"}
          onClick={() => editable && setEditing(true)}
        >
          {issue.title}
        </Text>
      )}

      <HStack gap="1.5" flexWrap="wrap">
        <Text fontSize="xs" color="fg.muted">
          Created by
        </Text>
        <ReporterAvatar initials={issue.reporterInitials} />
        <Text fontSize="xs" color="fg.muted">
          {issue.reporter}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          ·
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {formatRelativeTime(issue.createdAt)}
        </Text>
      </HStack>
    </Box>
  );
}

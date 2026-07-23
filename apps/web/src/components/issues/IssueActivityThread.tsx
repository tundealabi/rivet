import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useState } from "react";
import { PiPencilSimple, PiTrash, PiUserCircle } from "react-icons/pi";

import { formatActivityMessage } from "./issue-activity";
import { canDeleteComment, canEditComment } from "./issue-permissions";
import type { TimelineItem } from "./issue-timeline";
import {
  DEFAULT_REACTIONS,
  formatRelativeTime,
  type IssueActivityEvent,
  type IssueComment,
} from "./issue-types";
import { IssueMarkdown } from "./IssueMarkdown";
import { EASE_OUT, stagger, transition } from "./issues-motion";

function MemberAvatar({
  initials,
  size = "7",
}: {
  initials: string;
  size?: string;
}) {
  return (
    <Flex
      boxSize={size}
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

function ActivityEntry({ event }: { event: IssueActivityEvent }) {
  return (
    <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
      {formatActivityMessage(event)}
      <Text as="span" color="fg.muted" fontSize="xs">
        {" "}
        · {formatRelativeTime(event.createdAt)}
      </Text>
    </Text>
  );
}

interface CommentEntryProps {
  comment: IssueComment;
  index: number;
  role: OrganizationRole;
  currentUser: string;
  onEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
}

function CommentEntry({
  comment,
  index,
  role,
  currentUser,
  onEdit,
  onDelete,
  onToggleReaction,
}: CommentEntryProps) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const canEdit = canEditComment(role, comment.author, currentUser);
  const canDelete = canDeleteComment(role, comment.author, currentUser);
  const isPending = comment.syncStatus === "pending";
  const isFailed = comment.syncStatus === "failed";

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onEdit(comment.id, trimmed);
    setEditing(false);
  };

  return (
    <Box
      animation={`rivet-fade-in-up 0.35s ${EASE_OUT} both`}
      style={stagger(index, 40)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      opacity={isPending ? 0.72 : isFailed ? 0.85 : 1}
      transition={transition.base}
    >
      <Flex align="flex-start" justify="space-between" gap="2" mb="1.5">
        <HStack gap="2" flexWrap="wrap">
          <Text fontSize="sm" fontWeight="semibold" color="fg.primary">
            {comment.author}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {formatRelativeTime(comment.createdAt)}
          </Text>
          {isPending && (
            <Text fontSize="xs" color="fg.muted" fontStyle="italic">
              Sending…
            </Text>
          )}
          {isFailed && (
            <Text fontSize="xs" color="status.error">
              Failed to send
            </Text>
          )}
        </HStack>

        {(canEdit || canDelete) && hovered && !editing && !isPending && (
          <HStack gap="0.5" flexShrink="0">
            {canEdit && (
              <IconButton
                aria-label="Edit comment"
                size="xs"
                variant="ghost"
                color="fg.muted"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(true);
                }}
              >
                <PiPencilSimple size={14} />
              </IconButton>
            )}
            {canDelete && (
              <IconButton
                aria-label="Delete comment"
                size="xs"
                variant="ghost"
                color="fg.muted"
                _hover={{ color: "status.error" }}
                onClick={() => onDelete(comment.id)}
              >
                <PiTrash size={14} />
              </IconButton>
            )}
          </HStack>
        )}
      </Flex>

      {editing ? (
        <Stack gap="2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            borderRadius="control"
            fontSize="sm"
            autoFocus
          />
          <HStack justify="flex-end" gap="2">
            <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              bg="accent.default"
              color="white"
              onClick={saveEdit}
            >
              Save
            </Button>
          </HStack>
        </Stack>
      ) : (
        <IssueMarkdown content={comment.body} />
      )}

      {!isPending && (
        <HStack gap="1.5" mt="2.5" flexWrap="wrap">
          {DEFAULT_REACTIONS.map((emoji) => {
            const reaction = comment.reactions.find((r) => r.emoji === emoji);
            const count = reaction?.count ?? 0;
            const active = reaction?.reactedByMe ?? false;
            return (
              <Button
                key={emoji}
                size="xs"
                variant={active ? "subtle" : "ghost"}
                borderRadius="full"
                fontSize="xs"
                px="2"
                minH="6"
                bg={active ? "brand.subtle" : undefined}
                onClick={() => onToggleReaction(comment.id, emoji)}
              >
                {emoji}
                {count > 0 ? ` ${count}` : ""}
              </Button>
            );
          })}
        </HStack>
      )}
    </Box>
  );
}

interface IssueActivityThreadProps {
  items: TimelineItem[];
  role: OrganizationRole;
  currentUser: string;
  onEditComment: (commentId: string, body: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
}

export function IssueActivityThread({
  items,
  role,
  currentUser,
  onEditComment,
  onDeleteComment,
  onToggleReaction,
}: IssueActivityThreadProps) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="0.04em"
        mb="4"
      >
        Activity
      </Text>

      {items.length === 0 ? (
        <HStack gap="2" color="fg.muted" fontSize="sm" py="2">
          <PiUserCircle size={16} />
          <Text>No activity yet.</Text>
        </HStack>
      ) : (
        <Stack gap="0">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isActivity = item.kind === "activity";

            return (
              <Flex
                key={item.kind === "activity" ? item.data.id : item.data.id}
                gap="3"
                align="stretch"
                position="relative"
                pb={isLast ? "0" : "1"}
              >
                <Box
                  position="relative"
                  flexShrink="0"
                  w="7"
                  display="flex"
                  justifyContent="center"
                >
                  {!isLast && (
                    <Box
                      position="absolute"
                      top={isActivity ? "6" : "7"}
                      bottom="-8px"
                      w="1px"
                      bg="border.divider"
                      left="50%"
                      transform="translateX(-50%)"
                    />
                  )}
                  {isActivity ? (
                    <Flex
                      boxSize="5"
                      mt="0.5"
                      align="center"
                      justify="center"
                      borderRadius="full"
                      bg="bg.surfaceHover"
                      color="fg.muted"
                      position="relative"
                      zIndex="1"
                    >
                      <Box boxSize="1.5" borderRadius="full" bg="fg.muted" />
                    </Flex>
                  ) : (
                    <Box mt="0.5" position="relative" zIndex="1">
                      <MemberAvatar initials={item.data.authorInitials} />
                    </Box>
                  )}
                </Box>

                <Box flex="1" minW="0" pb={isLast ? "0" : "4"}>
                  {isActivity ? (
                    <ActivityEntry event={item.data} />
                  ) : (
                    <CommentEntry
                      comment={item.data}
                      index={index}
                      role={role}
                      currentUser={currentUser}
                      onEdit={onEditComment}
                      onDelete={onDeleteComment}
                      onToggleReaction={onToggleReaction}
                    />
                  )}
                </Box>
              </Flex>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

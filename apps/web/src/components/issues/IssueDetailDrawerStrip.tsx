import {
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Popover,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  PiArrowsOutSimple,
  PiCopy,
  PiDotsThreeBold,
  PiQuestion,
  PiX,
} from "react-icons/pi";

import { issueDetailPath } from "./issue-detail-context";
import { useIssueDetailShortcuts } from "./issue-detail-shortcuts";
import { formatProjectIssueKey, type Issue } from "./issue-types";
import { EASE_OUT, transition } from "./issues-motion";

const ISSUE_ID_COLOR = "#52525B";

function issueDirectUrl(projectId: string, issueId: string): string {
  return `${window.location.origin}${issueDetailPath(projectId, issueId)}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

interface IssueDetailDrawerStripProps {
  issue: Issue;
  onClose: () => void;
  onExpand: () => void;
  onNavigateToProject: () => void;
  onDelete: () => void;
  deletable: boolean;
  onDuplicate?: () => void;
  onMove?: () => void;
}

function OverflowMenu({
  deletable,
  watching,
  onToggleWatch,
  onDuplicate,
  onMove,
  onDelete,
}: {
  deletable: boolean;
  watching: boolean;
  onToggleWatch: () => void;
  onDuplicate: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const closeAnd = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      positioning={{ placement: "bottom-end" }}
    >
      <Popover.Trigger asChild>
        <IconButton
          aria-label="Issue actions"
          variant="ghost"
          size="xs"
          minW="7"
          h="7"
          borderRadius="control"
          color="fg.muted"
          _hover={{ color: "fg.primary", bg: "bg.surfaceHover" }}
        >
          <PiDotsThreeBold size={18} />
        </IconButton>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="bg.surface"
          borderRadius="control"
          borderWidth="1px"
          borderColor="border.default"
          boxShadow="elevated"
          p="1"
          minW="48"
          animation={`rivet-scale-in 0.2s ${EASE_OUT} both`}
        >
          <Stack gap="0.5">
            <Button
              variant="ghost"
              size="sm"
              justifyContent="flex-start"
              borderRadius="control"
              fontWeight="medium"
              color="fg.primary"
              onClick={() => closeAnd(onDuplicate)}
            >
              Duplicate issue
            </Button>
            <Button
              variant="ghost"
              size="sm"
              justifyContent="flex-start"
              borderRadius="control"
              fontWeight="medium"
              color="fg.primary"
              onClick={() => closeAnd(onMove)}
            >
              Move to another project
            </Button>
            <Button
              variant="ghost"
              size="sm"
              justifyContent="flex-start"
              borderRadius="control"
              fontWeight="medium"
              color="fg.primary"
              onClick={() => closeAnd(onToggleWatch)}
            >
              {watching ? "Unwatch" : "Watch"}
            </Button>
            {deletable && (
              <>
                <Box h="1px" bg="border.divider" my="0.5" />
                <Button
                  variant="ghost"
                  size="sm"
                  justifyContent="flex-start"
                  borderRadius="control"
                  fontWeight="medium"
                  color="status.error"
                  _hover={{ bg: "danger.ghostHover", color: "status.error" }}
                  onClick={() => closeAnd(onDelete)}
                >
                  Delete
                </Button>
              </>
            )}
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

export function IssueDetailDrawerStrip({
  issue,
  onClose,
  onExpand,
  onNavigateToProject,
  onDelete,
  deletable,
  onDuplicate,
  onMove,
}: IssueDetailDrawerStripProps) {
  const [watching, setWatching] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [idHovered, setIdHovered] = useState(false);
  const { setShortcutsOpen } = useIssueDetailShortcuts();

  const issueKey = formatProjectIssueKey(issue);
  const directUrl = issueDirectUrl(issue.projectId, issue.id);

  const copyLink = async () => {
    const ok = await copyToClipboard(directUrl);
    if (ok) toast.success("Link copied");
    else toast.error("Could not copy link");
  };

  const copyIssueId = async () => {
    const ok = await copyToClipboard(directUrl);
    if (ok) toast.success("Link copied");
    else toast.error("Could not copy link");
  };

  const handleDuplicate = () => {
    onDuplicate?.();
    toast.success("Issue duplicated");
  };

  const handleMove = () => {
    onMove?.();
    toast.success("Move issue — coming soon");
  };

  const handleToggleWatch = () => {
    setWatching((prev) => !prev);
    toast.success(watching ? "Unwatching issue" : "Watching issue");
  };

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap="3"
        px="4"
        py="2"
        minH="10"
        borderBottomWidth="1px"
        borderColor="border.default"
        bg="bg.surface"
        flexShrink="0"
        zIndex="1"
      >
        {/* Left */}
        <HStack gap="2" minW="0" flex="1">
          <Flex
            as="button"
            align="center"
            gap="1"
            minW="0"
            bg="transparent"
            border="none"
            cursor="pointer"
            p="0"
            color={ISSUE_ID_COLOR}
            fontFamily="mono"
            fontSize="xs"
            fontWeight="medium"
            letterSpacing="-0.01em"
            transition={transition.base}
            onMouseEnter={() => setIdHovered(true)}
            onMouseLeave={() => setIdHovered(false)}
            onClick={() => void copyIssueId()}
            _hover={{ color: "fg.primary" }}
            aria-label={`Copy link for ${issueKey}`}
          >
            <Text as="span" truncate>
              {issueKey}
            </Text>
            <Box
              as="span"
              display="inline-flex"
              opacity={idHovered ? 1 : 0}
              transition={transition.base}
              flexShrink="0"
              color="fg.muted"
            >
              <PiCopy size={12} />
            </Box>
          </Flex>

          <Text fontSize="xs" color="fg.muted" flexShrink="0">
            ·
          </Text>

          <Box
            as="button"
            fontSize="xs"
            color="fg.muted"
            truncate
            bg="transparent"
            border="none"
            cursor="pointer"
            p="0"
            textAlign="left"
            transition={transition.base}
            onClick={onNavigateToProject}
            _hover={{ color: "fg.secondary" }}
          >
            {issue.projectName}
          </Box>
        </HStack>

        {/* Right */}
        <HStack gap="0.5" flexShrink="0">
          <IconButton
            aria-label="Keyboard shortcuts"
            variant="ghost"
            size="xs"
            minW="7"
            h="7"
            borderRadius="control"
            color="fg.muted"
            _hover={{ color: "fg.primary", bg: "bg.surfaceHover" }}
            onClick={() => setShortcutsOpen(true)}
          >
            <PiQuestion size={16} />
          </IconButton>

          <IconButton
            aria-label="Expand to full page"
            variant="ghost"
            size="xs"
            minW="7"
            h="7"
            borderRadius="control"
            color="fg.muted"
            _hover={{ color: "fg.primary", bg: "bg.surfaceHover" }}
            onClick={onExpand}
          >
            <PiArrowsOutSimple size={16} />
          </IconButton>

          <IconButton
            aria-label="Copy link"
            variant="ghost"
            size="xs"
            minW="7"
            h="7"
            borderRadius="control"
            color="fg.muted"
            _hover={{ color: "fg.primary", bg: "bg.surfaceHover" }}
            onClick={() => void copyLink()}
          >
            <PiCopy size={16} />
          </IconButton>

          <OverflowMenu
            deletable={deletable}
            watching={watching}
            onToggleWatch={handleToggleWatch}
            onDuplicate={handleDuplicate}
            onMove={handleMove}
            onDelete={() => setDeleteOpen(true)}
          />

          <IconButton
            aria-label="Close issue detail"
            variant="ghost"
            size="xs"
            minW="7"
            h="7"
            borderRadius="control"
            color="fg.muted"
            _hover={{ color: "fg.primary", bg: "bg.surfaceHover" }}
            onClick={onClose}
          >
            <PiX size={18} />
          </IconButton>
        </HStack>
      </Flex>

      <Dialog.Root
        open={deleteOpen}
        onOpenChange={(e) => setDeleteOpen(e.open)}
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
              <Dialog.Title color="fg.primary">Delete issue?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body px="6" py="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                This will permanently delete{" "}
                <Text as="span" fontFamily="mono" color="fg.primary">
                  {issueKey}
                </Text>
                . This action cannot be undone.
              </Text>
            </Dialog.Body>
            <Dialog.Footer px="6" pb="6" pt="0" gap="3">
              <Button
                variant="outline"
                borderRadius="control"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                borderRadius="control"
                bg="status.error"
                color="white"
                _hover={{ bg: "red.600" }}
                onClick={() => {
                  setDeleteOpen(false);
                  onDelete();
                  toast.success("Issue deleted");
                }}
              >
                Delete issue
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}

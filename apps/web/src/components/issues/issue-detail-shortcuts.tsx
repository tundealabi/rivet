import { Box, Dialog, Flex, Kbd, Stack, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type IssueDetailShortcutHandlers,
  IssueDetailShortcutsContext,
  useIssueDetailShortcuts,
} from "./issue-detail-shortcuts-context";
import type { IssueDetailVariant } from "./IssueDetailContent";
import { EASE_OUT } from "./issues-motion";

export function IssueDetailShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const handlersRef = useRef<IssueDetailShortcutHandlers>({});
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const register = useCallback((handlers: IssueDetailShortcutHandlers) => {
    handlersRef.current = { ...handlersRef.current, ...handlers };
    return () => {
      for (const key of Object.keys(
        handlers
      ) as (keyof IssueDetailShortcutHandlers)[]) {
        if (handlersRef.current[key] === handlers[key]) {
          delete handlersRef.current[key];
        }
      }
    };
  }, []);

  const getHandlers = useCallback(() => handlersRef.current, []);

  const value = useMemo(
    () => ({
      register,
      shortcutsOpen,
      setShortcutsOpen,
      getHandlers,
    }),
    [register, shortcutsOpen, getHandlers]
  );

  return (
    <IssueDetailShortcutsContext.Provider value={value}>
      {children}
    </IssueDetailShortcutsContext.Provider>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const SHORTCUT_ROWS: { keys: string[]; label: string }[] = [
  { keys: ["E"], label: "Edit description" },
  { keys: ["C"], label: "Focus comment box" },
  { keys: ["A"], label: "Open assignee picker" },
  { keys: ["S"], label: "Open status picker" },
  { keys: ["P"], label: "Open priority picker" },
  { keys: ["Esc"], label: "Close drawer" },
  { keys: ["←", "→"], label: "Previous / next issue in list" },
  {
    keys: [isMac ? "⌘" : "Ctrl", "Enter"],
    label: "Submit comment",
  },
];

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <Flex align="center" justify="space-between" gap="4" py="2">
      <Text fontSize="sm" color="fg.secondary">
        {label}
      </Text>
      <HStackShortcutKeys keys={keys} />
    </Flex>
  );
}

function HStackShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <Flex gap="1" flexShrink="0">
      {keys.map((key, index) => (
        <Kbd
          key={`${key}-${index}`}
          fontSize="xs"
          px="2"
          py="1"
          borderRadius="sm"
          bg="bg.surfaceHover"
          borderColor="border.default"
          color="fg.primary"
          fontWeight="medium"
        >
          {key}
        </Kbd>
      ))}
    </Flex>
  );
}

export function IssueShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useIssueDetailShortcuts();

  return (
    <Dialog.Root
      open={shortcutsOpen}
      onOpenChange={(e) => setShortcutsOpen(e.open)}
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
          <Dialog.Header pt="6" px="6" pb="2">
            <Dialog.Title color="fg.primary" fontSize="md">
              Keyboard shortcuts
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" pb="6" pt="0">
            <Stack gap="0">
              {SHORTCUT_ROWS.map((row, index) => (
                <Box key={row.label}>
                  {index > 0 && <Box h="1px" bg="border.divider" my="1" />}
                  <ShortcutRow keys={row.keys} label={row.label} />
                </Box>
              ))}
            </Stack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface IssueDetailKeyboardShortcutsProps {
  issueId: string;
  variant: IssueDetailVariant;
  enabled: boolean;
  onClose?: () => void;
  navigableIssueIds?: string[];
  onNavigateToIssue?: (issueId: string) => void;
}

export function IssueDetailKeyboardShortcuts({
  issueId,
  variant,
  enabled,
  onClose,
  navigableIssueIds = [],
  onNavigateToIssue,
}: IssueDetailKeyboardShortcutsProps) {
  const { getHandlers, setShortcutsOpen, shortcutsOpen } =
    useIssueDetailShortcuts();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const handlers = getHandlers();
      const typing = isTypingTarget(event.target);
      const key = event.key.toLowerCase();

      if (event.key === "Escape") {
        if (shortcutsOpen) {
          event.preventDefault();
          setShortcutsOpen(false);
          return;
        }
        if (onClose) {
          event.preventDefault();
          onClose();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        if (handlers.submitComment) {
          event.preventDefault();
          handlers.submitComment();
        }
        return;
      }

      if (typing) return;

      if (event.key === "?" && event.shiftKey) {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (key === "e" && handlers.editDescription) {
        event.preventDefault();
        handlers.editDescription();
        return;
      }

      if (key === "c" && handlers.focusComment) {
        event.preventDefault();
        handlers.focusComment();
        return;
      }

      if (key === "a" && handlers.openAssigneePicker) {
        event.preventDefault();
        handlers.openAssigneePicker();
        return;
      }

      if (key === "s" && handlers.openStatusPicker) {
        event.preventDefault();
        handlers.openStatusPicker();
        return;
      }

      if (key === "p" && handlers.openPriorityPicker) {
        event.preventDefault();
        handlers.openPriorityPicker();
        return;
      }

      if (
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        onNavigateToIssue &&
        navigableIssueIds.length > 1
      ) {
        const index = navigableIssueIds.indexOf(issueId);
        if (index === -1) return;

        const nextIndex = event.key === "ArrowLeft" ? index - 1 : index + 1;
        const nextId = navigableIssueIds[nextIndex];
        if (nextId) {
          event.preventDefault();
          onNavigateToIssue(nextId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    getHandlers,
    issueId,
    navigableIssueIds,
    onClose,
    onNavigateToIssue,
    setShortcutsOpen,
    shortcutsOpen,
    variant,
  ]);

  return null;
}

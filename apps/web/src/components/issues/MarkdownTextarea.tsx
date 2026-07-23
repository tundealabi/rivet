import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import {
  PiCode,
  PiLink,
  PiListBullets,
  PiListChecks,
  PiTextBBold,
  PiTextItalic,
} from "react-icons/pi";

import {
  formatProjectIssueKey,
  type Issue,
  type TeamMember,
} from "./issue-types";
import { transition } from "./issues-motion";
import { draftStorageKey } from "./markdown-draft";

type AutocompleteKind = "mention" | "issue" | null;

interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  teamMembers: TeamMember[];
  projectIssues: Pick<Issue, "id" | "projectKey" | "number" | "title">[];
  draftKey?: string;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function MarkdownTextarea({
  value,
  onChange,
  placeholder,
  rows = 8,
  teamMembers,
  projectIssues,
  draftKey,
  autoFocus,
  inputRef,
}: MarkdownTextareaProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? internalRef;
  const [autocomplete, setAutocomplete] = useState<AutocompleteKind>(null);
  const [query, setQuery] = useState("");
  const [triggerIndex, setTriggerIndex] = useState(-1);

  useEffect(() => {
    if (!draftKey) return;
    const stored = localStorage.getItem(draftStorageKey(draftKey));
    if (stored && !value) onChange(stored);
  }, [draftKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!draftKey) return;
    if (value.trim()) {
      localStorage.setItem(draftStorageKey(draftKey), value);
    } else {
      localStorage.removeItem(draftStorageKey(draftKey));
    }
  }, [value, draftKey]);

  const insertAtCursor = (before: string, after = "", placeholderText = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholderText;
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleChange = (next: string) => {
    onChange(next);
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const before = next.slice(0, pos);
    const atMatch = before.match(/@([\w\s.]*)$/);
    const hashMatch = before.match(/#([\w-]*)$/);
    if (atMatch) {
      setAutocomplete("mention");
      setQuery(atMatch[1].trim().toLowerCase());
      setTriggerIndex(pos - atMatch[0].length);
    } else if (hashMatch) {
      setAutocomplete("issue");
      setQuery(hashMatch[1].toLowerCase());
      setTriggerIndex(pos - hashMatch[0].length);
    } else {
      setAutocomplete(null);
      setQuery("");
      setTriggerIndex(-1);
    }
  };

  const applyAutocomplete = (replacement: string) => {
    if (triggerIndex < 0) return;
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? value.length;
    const next = value.slice(0, triggerIndex) + replacement + value.slice(pos);
    onChange(next);
    setAutocomplete(null);
    setQuery("");
    setTriggerIndex(-1);
  };

  const mentionOptions = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(query)
  );
  const issueOptions = projectIssues.filter((issue) => {
    const key = formatProjectIssueKey(issue).toLowerCase();
    return key.includes(query) || issue.title.toLowerCase().includes(query);
  });

  const toolbar = (
    <HStack
      gap="0.5"
      px="2"
      py="1.5"
      borderBottomWidth="1px"
      borderColor="border.default"
      bg="bg.surfaceHover"
      borderTopRadius="control"
      flexWrap="wrap"
    >
      <IconButton
        aria-label="Bold"
        size="xs"
        variant="ghost"
        onClick={() => insertAtCursor("**", "**", "bold")}
      >
        <PiTextBBold size={14} />
      </IconButton>
      <IconButton
        aria-label="Italic"
        size="xs"
        variant="ghost"
        onClick={() => insertAtCursor("*", "*", "italic")}
      >
        <PiTextItalic size={14} />
      </IconButton>
      <IconButton
        aria-label="Code"
        size="xs"
        variant="ghost"
        onClick={() => insertAtCursor("`", "`", "code")}
      >
        <PiCode size={14} />
      </IconButton>
      <IconButton
        aria-label="Link"
        size="xs"
        variant="ghost"
        onClick={() => insertAtCursor("[", "](url)", "text")}
      >
        <PiLink size={14} />
      </IconButton>
      <IconButton
        aria-label="List"
        size="xs"
        variant="ghost"
        onClick={() => insertAtCursor("\n- ", "", "item")}
      >
        <PiListBullets size={14} />
      </IconButton>
      <IconButton
        aria-label="Checkbox"
        size="xs"
        variant="ghost"
        onClick={() => insertAtCursor("\n- [ ] ", "", "task")}
      >
        <PiListChecks size={14} />
      </IconButton>
    </HStack>
  );

  return (
    <Box position="relative">
      <Box
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="control"
        overflow="hidden"
        bg="bg.surface"
      >
        {toolbar}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          border="none"
          borderRadius="0"
          resize="vertical"
          fontSize="sm"
          lineHeight="1.6"
          px="3"
          py="3"
          autoFocus={autoFocus}
          _focus={{ boxShadow: "none", outline: "none" }}
        />
      </Box>

      {autocomplete && (
        <Box
          position="absolute"
          top="full"
          left="0"
          mt="1"
          zIndex="popover"
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="control"
          boxShadow="elevated"
          minW="48"
          maxH="40"
          overflowY="auto"
          py="1"
        >
          {autocomplete === "mention" &&
            mentionOptions.map((member) => (
              <Button
                key={member.name}
                variant="ghost"
                size="sm"
                w="full"
                justifyContent="flex-start"
                borderRadius="0"
                fontWeight="medium"
                onClick={() => applyAutocomplete(`@${member.name} `)}
              >
                {member.name}
              </Button>
            ))}
          {autocomplete === "issue" &&
            issueOptions.map((issue) => (
              <Button
                key={issue.id}
                variant="ghost"
                size="sm"
                w="full"
                justifyContent="flex-start"
                borderRadius="0"
                fontWeight="medium"
                onClick={() =>
                  applyAutocomplete(`#${formatProjectIssueKey(issue)} `)
                }
              >
                <Flex direction="column" align="flex-start" gap="0">
                  <Text fontFamily="mono" fontSize="xs" color="fg.muted">
                    {formatProjectIssueKey(issue)}
                  </Text>
                  <Text fontSize="sm">{issue.title}</Text>
                </Flex>
              </Button>
            ))}
          {((autocomplete === "mention" && mentionOptions.length === 0) ||
            (autocomplete === "issue" && issueOptions.length === 0)) && (
            <Text px="3" py="2" fontSize="xs" color="fg.muted">
              No matches
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}

interface MarkdownEditorActionsProps {
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
}

export function MarkdownEditorActions({
  onSave,
  onCancel,
  saveLabel = "Save",
}: MarkdownEditorActionsProps) {
  return (
    <HStack gap="2" mt="3" justify="flex-end">
      <Button
        variant="ghost"
        size="sm"
        borderRadius="control"
        onClick={onCancel}
        transition={transition.base}
      >
        Cancel
      </Button>
      <Button
        size="sm"
        borderRadius="control"
        bg="accent.default"
        color="white"
        _hover={{ bg: "accent.hover" }}
        onClick={onSave}
      >
        {saveLabel}
      </Button>
    </HStack>
  );
}

export function MarkdownEditorHint() {
  return (
    <Text fontSize="xs" color="fg.muted" mt="2">
      Use @ to mention teammates, # to link issues
    </Text>
  );
}

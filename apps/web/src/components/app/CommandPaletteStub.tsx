import { Box, Dialog, HStack, Input, Kbd, Stack, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { scaleIn } from "../issues/issues-motion";
import {
  dispatchOpenOrgSwitcher,
  orgSwitcherItemBg,
  orgSwitcherMenuItemStyles,
} from "./org-switcher-ui";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  onSelect: () => void;
}

export function CommandPaletteStub() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: "switch-org",
        label: "Switch organization",
        hint: "Open the org switcher",
        onSelect: () => {
          setOpen(false);
          dispatchOpenOrgSwitcher();
        },
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;
    return commands.filter((item) =>
      item.label.toLowerCase().includes(normalized)
    );
  }, [commands, query]);

  useEffect(() => {
    const openPalette = () => {
      setOpen(true);
      setQuery("");
      setHighlightIndex(0);
    };
    window.addEventListener("rivet:command-palette", openPalette);
    return () =>
      window.removeEventListener("rivet:command-palette", openPalette);
  }, []);

  useEffect(() => {
    if (open) {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    setHighlightIndex(0);
  }

  const activate = useCallback(
    (index: number) => {
      const item = filtered[index];
      if (!item) return;
      item.onSelect();
    },
    [filtered]
  );

  const handleListKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (filtered.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightIndex((current) => (current + 1) % filtered.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightIndex(
            (current) => (current - 1 + filtered.length) % filtered.length
          );
          break;
        case "Enter":
          event.preventDefault();
          activate(highlightIndex);
          break;
        default:
          break;
      }
    },
    [activate, filtered.length, highlightIndex]
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => setOpen(event.open)}
      placement="top"
    >
      <Dialog.Backdrop bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <Dialog.Positioner pt="20vh">
        <Dialog.Content
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="card"
          maxW="lg"
          w="full"
          mx="4"
          overflow="hidden"
          boxShadow="elevated"
          {...scaleIn}
        >
          <Dialog.Header px="4" pt="4" pb="2">
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleListKeyDown}
              placeholder="Search commands…"
              border="none"
              px="0"
              fontSize="md"
              _focusVisible={{ boxShadow: "none", outline: "none" }}
            />
          </Dialog.Header>
          <Dialog.Body px="2" pb="2" pt="0">
            <Stack gap="0.5" role="listbox">
              {filtered.length === 0 ? (
                <Text px="3" py="4" fontSize="sm" color="fg.muted">
                  No matching commands
                </Text>
              ) : (
                filtered.map((item, index) => (
                  <HStack
                    key={item.id}
                    as="button"
                    {...orgSwitcherMenuItemStyles}
                    bg={orgSwitcherItemBg(index === highlightIndex)}
                    _hover={{ bg: "orgSwitcher.hover" }}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => activate(index)}
                  >
                    <Box minW="0" flex="1" textAlign="left">
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="fg.primary"
                      >
                        {item.label}
                      </Text>
                      {item.hint && (
                        <Text fontSize="xs" color="fg.muted" mt="0.5">
                          {item.hint}
                        </Text>
                      )}
                    </Box>
                    <Kbd
                      fontSize="10px"
                      px="1.5"
                      py="0.5"
                      borderRadius="sm"
                      bg="bg.surfaceHover"
                      borderColor="border.default"
                    >
                      ↵
                    </Kbd>
                  </HStack>
                ))
              )}
            </Stack>
          </Dialog.Body>
          <Box
            px="4"
            py="2.5"
            borderTopWidth="1px"
            borderColor="border.default"
            bg="bg.sidebar"
          >
            <HStack gap="3" fontSize="xs" color="fg.muted">
              <HStack gap="1">
                <Kbd fontSize="10px">↑</Kbd>
                <Kbd fontSize="10px">↓</Kbd>
                <Text>Navigate</Text>
              </HStack>
              <HStack gap="1">
                <Kbd fontSize="10px">↵</Kbd>
                <Text>Select</Text>
              </HStack>
              <HStack gap="1">
                <Kbd fontSize="10px">Esc</Kbd>
                <Text>Close</Text>
              </HStack>
            </HStack>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

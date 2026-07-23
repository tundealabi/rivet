import { Box, Button, Text } from "@chakra-ui/react";
import { PiKanban, PiTable } from "react-icons/pi";

import { EASE_OUT, transition } from "./issues-motion";

export type IssuesViewMode = "table" | "board";

export function IssuesViewToggle({
  value,
  onChange,
}: {
  value: IssuesViewMode;
  onChange: (mode: IssuesViewMode) => void;
}) {
  const modes = [
    { mode: "table" as const, icon: PiTable, label: "Table" },
    { mode: "board" as const, icon: PiKanban, label: "Board" },
  ];
  const activeIndex = modes.findIndex((m) => m.mode === value);

  return (
    <Box
      position="relative"
      display="inline-flex"
      p="0.5"
      bg="bg.surfaceHover"
      borderRadius="control"
      borderWidth="1px"
      borderColor="border.default"
    >
      <Box
        position="absolute"
        top="2px"
        bottom="2px"
        left={activeIndex === 0 ? "2px" : "calc(50% + 1px)"}
        w="calc(50% - 3px)"
        bg="bg.surface"
        borderRadius="calc(var(--chakra-radii-control) - 2px)"
        boxShadow="subtle"
        transition={`left 0.28s ${EASE_OUT}, box-shadow 0.28s ${EASE_OUT}`}
        pointerEvents="none"
      />
      {modes.map(({ mode, icon: Icon, label }) => {
        const active = value === mode;
        return (
          <Button
            key={mode}
            size="sm"
            variant="ghost"
            position="relative"
            zIndex="1"
            borderRadius="control"
            px="3.5"
            minW="auto"
            h="8"
            bg="transparent"
            color={active ? "fg.primary" : "fg.muted"}
            fontWeight={active ? "semibold" : "medium"}
            transition={transition.base}
            _hover={{ bg: "transparent", color: "fg.primary" }}
            onClick={() => onChange(mode)}
            aria-pressed={active}
            aria-label={`${label} view`}
          >
            <Icon size={16} />
            <Text display={{ base: "none", sm: "inline" }} fontSize="sm">
              {label}
            </Text>
          </Button>
        );
      })}
    </Box>
  );
}

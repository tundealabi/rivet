import { Box, Button, HStack, Menu, Text } from "@chakra-ui/react";
import {
  PiCaretDown,
  PiCheckCircle,
  PiCircle,
  PiCircleDashed,
  PiCircleHalf,
  PiEye,
  PiXCircle,
} from "react-icons/pi";

import { STATUS_OPTIONS } from "./issue-filters";
import { STATUS_DOT_COLOR } from "./issue-types";
import type { IssueStatus } from "./IssueFilterBar";
import { EASE_OUT, transition } from "./issues-motion";

const STATUS_ICONS = {
  backlog: PiCircleDashed,
  todo: PiCircle,
  in_progress: PiCircleHalf,
  in_review: PiEye,
  done: PiCheckCircle,
  cancelled: PiXCircle,
} as const;

function IssueStatusIcon({
  status,
  size = 16,
}: {
  status: IssueStatus;
  size?: number;
}) {
  const Icon = STATUS_ICONS[status];

  return (
    <Box
      as="span"
      color={STATUS_DOT_COLOR[status]}
      lineHeight="0"
      flexShrink="0"
    >
      <Icon size={size} aria-hidden />
    </Box>
  );
}

export function IssueStatusSelect({
  value,
  onChange,
}: {
  value: IssueStatus;
  onChange: (status: IssueStatus) => void;
}) {
  const selectedLabel =
    STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;

  return (
    <Menu.Root positioning={{ placement: "bottom-start", sameWidth: true }}>
      <Menu.Trigger asChild>
        <Button
          type="button"
          unstyled
          w="full"
          h="8"
          px="2.5"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap="2"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="control"
          bg="bg.surface"
          cursor="pointer"
          transition={transition.base}
          _hover={{ bg: "bg.surfaceHover" }}
          _focusVisible={{
            outline: "2px solid",
            outlineColor: "accent.default",
            outlineOffset: "1px",
          }}
        >
          <HStack gap="2" minW="0">
            <IssueStatusIcon status={value} />
            <Text fontSize="sm" color="fg.primary" truncate>
              {selectedLabel}
            </Text>
          </HStack>
          <Box color="fg.muted" lineHeight="0" flexShrink="0">
            <PiCaretDown size={14} />
          </Box>
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="control"
          boxShadow="elevated"
          p="1"
          zIndex="popover"
          animation={`rivet-scale-in 0.2s ${EASE_OUT} both`}
        >
          {STATUS_OPTIONS.map((option) => {
            const selected = option.value === value;

            return (
              <Menu.Item
                key={option.value}
                value={option.value}
                borderRadius="control"
                bg={selected ? "brand.subtle" : "transparent"}
                fontWeight={selected ? "semibold" : "normal"}
                onClick={() => onChange(option.value)}
              >
                <HStack gap="2">
                  <IssueStatusIcon status={option.value} />
                  <Text fontSize="sm" color="fg.primary">
                    {option.label}
                  </Text>
                </HStack>
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}

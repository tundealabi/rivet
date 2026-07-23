import { Box, Button, Flex, Text } from "@chakra-ui/react";

import { EASE_OUT } from "../issues/issues-motion";
import type { BillingInterval } from "./billing-types";
import { YEARLY_DISCOUNT_PERCENT } from "./billing-types";

const CARD_BORDER = "#ECEEF2";

interface BillingIntervalToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  disabled?: boolean;
}

export function BillingIntervalToggle({
  value,
  onChange,
  disabled = false,
}: BillingIntervalToggleProps) {
  const activeIndex = value === "monthly" ? 0 : 1;
  const modes: { interval: BillingInterval; label: string }[] = [
    { interval: "monthly", label: "Monthly" },
    { interval: "yearly", label: "Yearly" },
  ];

  return (
    <Flex align="center" justify="center" gap="3" flexWrap="wrap">
      <Box
        position="relative"
        display="inline-flex"
        p="0.5"
        bg="bg.surfaceHover"
        borderRadius="control"
        borderWidth="1px"
        borderColor={CARD_BORDER}
        opacity={disabled ? 0.6 : 1}
      >
        <Box
          position="absolute"
          top="2px"
          bottom="2px"
          left={activeIndex === 0 ? "2px" : "calc(50% + 1px)"}
          w="calc(50% - 3px)"
          bg="bg.surface"
          borderRadius="calc(var(--chakra-radii-control) - 2px)"
          transition={`left 0.28s ${EASE_OUT}`}
          pointerEvents="none"
        />
        {modes.map(({ interval, label }) => {
          const active = value === interval;
          return (
            <Button
              key={interval}
              size="sm"
              variant="ghost"
              position="relative"
              zIndex="1"
              borderRadius="control"
              px="4"
              minW="24"
              h="8"
              bg="transparent"
              color={active ? "fg.primary" : "fg.muted"}
              fontWeight={active ? "semibold" : "medium"}
              fontSize="sm"
              _hover={{
                bg: "transparent",
                color: disabled ? "fg.muted" : "fg.primary",
              }}
              disabled={disabled}
              onClick={() => onChange(interval)}
              aria-pressed={active}
            >
              {label}
            </Button>
          );
        })}
      </Box>

      {value === "yearly" && (
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="accent.default"
          bg="#EEF2FF"
          px="2.5"
          py="1"
          borderRadius="badge"
        >
          Save {YEARLY_DISCOUNT_PERCENT}%
        </Text>
      )}

      {disabled && (
        <Text fontSize="xs" color="fg.muted">
          Billing period is locked for your current subscription
        </Text>
      )}
    </Flex>
  );
}

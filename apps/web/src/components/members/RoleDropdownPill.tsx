import { Box, HStack, Popover, Text } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { PiCaretDown } from "react-icons/pi";

import { transition } from "../issues/issues-motion";
import { canAssignOwner } from "./member-permissions";
import { ROLE_DOT_COLORS, ROLE_LABELS } from "./member-types";

interface RoleDropdownPillProps {
  role: OrganizationRole;
  actorRole: OrganizationRole;
  locked?: boolean;
  onChange?: (role: OrganizationRole) => void;
}

const ALL_ROLES = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.MEMBER,
  OrganizationRole.VIEWER,
];

function RoleDot({ role }: { role: OrganizationRole }) {
  return (
    <Box
      boxSize="2"
      borderRadius="full"
      bg={ROLE_DOT_COLORS[role]}
      flexShrink="0"
    />
  );
}

function RolePillContent({
  role,
  interactive,
}: {
  role: OrganizationRole;
  interactive?: boolean;
}) {
  return (
    <HStack
      gap="1.5"
      cursor={interactive ? "pointer" : "default"}
      transition={transition.base}
      _hover={interactive ? { "& > p": { color: "fg.primary" } } : undefined}
    >
      <RoleDot role={role} />
      <Text fontSize="sm" fontWeight="medium" color="fg.secondary">
        {ROLE_LABELS[role]}
      </Text>
      {interactive && (
        <Box color="fg.muted" lineHeight="0">
          <PiCaretDown size={12} />
        </Box>
      )}
    </HStack>
  );
}

export function RoleDropdownPill({
  role,
  actorRole,
  locked = false,
  onChange,
}: RoleDropdownPillProps) {
  if (locked || !onChange) {
    return <RolePillContent role={role} />;
  }

  const allowOwner = canAssignOwner(actorRole);

  return (
    <Popover.Root positioning={{ placement: "bottom-start" }}>
      <Popover.Trigger asChild>
        <Box as="button" bg="transparent" border="none" p="0">
          <RolePillContent role={role} interactive />
        </Box>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="control"
          boxShadow="elevated"
          p="1"
          minW="36"
        >
          {ALL_ROLES.map((option) => {
            const disabled =
              option === OrganizationRole.OWNER
                ? !allowOwner || role === OrganizationRole.OWNER
                : false;
            const selected = option === role;

            return (
              <Box
                key={option}
                as="button"
                display="flex"
                w="full"
                alignItems="center"
                gap="2"
                px="2.5"
                py="2"
                borderRadius="control"
                bg={selected ? "brand.subtle" : "transparent"}
                border="none"
                cursor={disabled ? "not-allowed" : "pointer"}
                opacity={disabled ? 0.45 : 1}
                _hover={disabled ? undefined : { bg: "bg.surfaceHover" }}
                onClick={() => {
                  if (disabled || selected) return;
                  onChange(option);
                }}
              >
                <RoleDot role={option} />
                <Text
                  fontSize="sm"
                  color="fg.primary"
                  fontWeight={selected ? "semibold" : "medium"}
                >
                  {ROLE_LABELS[option]}
                </Text>
              </Box>
            );
          })}
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

export function RolePill({ role }: { role: OrganizationRole }) {
  return <RolePillContent role={role} />;
}

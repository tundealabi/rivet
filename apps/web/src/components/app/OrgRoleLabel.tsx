import { Box, HStack, Text } from "@chakra-ui/react";
import type { OrganizationRole } from "@rivet/shared";

import { ROLE_DOT_COLORS, ROLE_LABELS } from "../members/member-types";

interface OrgRoleLabelProps {
  role: OrganizationRole;
  prefix?: string;
  size?: "xs" | "sm";
}

function RoleDot({ role }: { role: OrganizationRole }) {
  return (
    <Box
      boxSize="1.5"
      borderRadius="full"
      bg={ROLE_DOT_COLORS[role]}
      flexShrink="0"
    />
  );
}

export function OrgRoleLabel({ role, prefix, size = "xs" }: OrgRoleLabelProps) {
  const label = prefix ? `${prefix} ${ROLE_LABELS[role]}` : ROLE_LABELS[role];

  return (
    <HStack gap="1.5" minW="0">
      <RoleDot role={role} />
      <Text fontSize={size} color="fg.muted" truncate lineHeight="1.3">
        {label}
      </Text>
    </HStack>
  );
}

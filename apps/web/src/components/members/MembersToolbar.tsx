import { Box, Flex, HStack, Input, InputGroup } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { PiMagnifyingGlass } from "react-icons/pi";

import { transition } from "../issues/issues-motion";
import type { MemberRoleFilter } from "./member-utils";

const ROLE_FILTERS: { id: MemberRoleFilter; label: string }[] = [
  { id: "all", label: "All roles" },
  { id: OrganizationRole.OWNER, label: "Owners" },
  { id: OrganizationRole.ADMIN, label: "Admins" },
  { id: OrganizationRole.MEMBER, label: "Members" },
  { id: OrganizationRole.VIEWER, label: "Viewers" },
];

interface MembersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: MemberRoleFilter;
  onRoleFilterChange: (filter: MemberRoleFilter) => void;
}

export function MembersToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: MembersToolbarProps) {
  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      gap="3"
      mb="4"
      align={{ base: "stretch", md: "center" }}
      justify="space-between"
    >
      <InputGroup
        maxW={{ base: "full", md: "sm" }}
        startElement={<PiMagnifyingGlass />}
      >
        <Input
          placeholder="Search members by name or email..."
          borderRadius="control"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

      <HStack gap="2" flexWrap="wrap">
        {ROLE_FILTERS.map((filter) => {
          const active = roleFilter === filter.id;
          return (
            <Box
              key={filter.id}
              as="button"
              px="3"
              py="1.5"
              borderRadius="badge"
              fontSize="xs"
              fontWeight="medium"
              borderWidth="1px"
              borderColor={active ? "accent.default" : "border.default"}
              bg={active ? "brand.subtle" : "bg.surface"}
              color={active ? "accent.default" : "fg.secondary"}
              cursor="pointer"
              transition={transition.base}
              _hover={{
                borderColor: active ? "accent.default" : "fg.muted",
                color: active ? "accent.default" : "fg.primary",
              }}
              onClick={() => onRoleFilterChange(filter.id)}
            >
              {filter.label}
            </Box>
          );
        })}
      </HStack>
    </Flex>
  );
}

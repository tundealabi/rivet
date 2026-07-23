import { Badge, Box, Flex, HStack, Text } from "@chakra-ui/react";

import { transition } from "../issues/issues-motion";

export type MembersTab = "members" | "pending";

interface MembersTabsProps {
  value: MembersTab;
  onChange: (tab: MembersTab) => void;
  pendingCount: number;
  showPendingTab?: boolean;
}

const TABS: { id: MembersTab; label: string; muted?: boolean }[] = [
  { id: "members", label: "Members" },
  { id: "pending", label: "Pending invites", muted: true },
];

export function MembersTabs({
  value,
  onChange,
  pendingCount,
  showPendingTab = true,
}: MembersTabsProps) {
  const visibleTabs = showPendingTab
    ? TABS
    : TABS.filter((tab) => tab.id === "members");

  return (
    <Flex
      px={{ base: "5", md: "10" }}
      borderBottomWidth="1px"
      borderColor="border.default"
      bg="bg.surface"
      gap="6"
      overflowX="auto"
      flexShrink="0"
      css={{
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {visibleTabs.map((tab) => {
        const active = value === tab.id;
        const showBadge = tab.id === "pending" && pendingCount > 0;
        const muted = tab.muted && !active;

        return (
          <Box
            key={tab.id}
            as="button"
            position="relative"
            pb="3"
            pt="3"
            bg="transparent"
            border="none"
            cursor="pointer"
            flexShrink="0"
            color={active ? "fg.primary" : muted ? "#A1A1AA" : "fg.muted"}
            fontWeight={active ? "semibold" : "medium"}
            fontSize="sm"
            fontStyle={muted && !active ? "italic" : undefined}
            transition={transition.base}
            _hover={{ color: "fg.primary" }}
            _after={
              active
                ? {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "-1px",
                    h: "2px",
                    bg: "accent.default",
                    borderRadius: "full",
                  }
                : undefined
            }
            onClick={() => onChange(tab.id)}
            aria-selected={active}
            role="tab"
          >
            <HStack gap="2">
              <Text>{tab.label}</Text>
              {showBadge && (
                <Badge
                  px="1.5"
                  py="0"
                  minW="5"
                  h="5"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="badge"
                  bg="brand.subtle"
                  color="accent.default"
                  fontSize="2xs"
                  fontWeight="semibold"
                >
                  {pendingCount}
                </Badge>
              )}
            </HStack>
          </Box>
        );
      })}
    </Flex>
  );
}

import { Box, Flex, Text } from "@chakra-ui/react";

import { transition } from "../issues/issues-motion";

export type ProjectDetailTab = "issues" | "overview" | "settings";

const ALL_TABS: { id: ProjectDetailTab; label: string; adminOnly?: boolean }[] =
  [
    { id: "issues", label: "Issues" },
    { id: "overview", label: "Overview" },
    { id: "settings", label: "Settings", adminOnly: true },
  ];

interface ProjectDetailTabsProps {
  value: ProjectDetailTab;
  onChange: (tab: ProjectDetailTab) => void;
  showSettings?: boolean;
}

export function ProjectDetailTabs({
  value,
  onChange,
  showSettings = false,
}: ProjectDetailTabsProps) {
  const tabs = ALL_TABS.filter((tab) => !tab.adminOnly || showSettings);
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
      {tabs.map((tab) => {
        const active = value === tab.id;
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
            color={active ? "accent.default" : "fg.muted"}
            fontWeight={active ? "semibold" : "medium"}
            fontSize="sm"
            transition={transition.base}
            _hover={active ? undefined : { color: "fg.primary" }}
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
            <Text>{tab.label}</Text>
          </Box>
        );
      })}
    </Flex>
  );
}

import { Box, Flex, Stack, Text } from "@chakra-ui/react";

import { transition } from "../issues/issues-motion";
import { isOrgSettingsSection } from "./settings-sections";
import type { SettingsSectionId } from "./settings-types";

interface NavItem {
  id: SettingsSectionId;
  label: string;
}

function buildOrgItems(showOrgDanger: boolean): NavItem[] {
  const items: NavItem[] = [
    { id: "organization", label: "General" },
    { id: "organizationNotifications", label: "Notifications" },
  ];
  if (showOrgDanger) {
    items.push({ id: "orgDanger", label: "Danger zone" });
  }
  return items;
}

const ACCOUNT_ITEMS: NavItem[] = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "danger", label: "Danger zone" },
];

interface SettingsNavProps {
  value: SettingsSectionId;
  onChange: (section: SettingsSectionId) => void;
  showOrgGroup: boolean;
  showOrgDanger: boolean;
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      w="full"
      textAlign="left"
      px="3"
      py="2"
      borderRadius="control"
      fontSize="sm"
      fontWeight={active ? "semibold" : "medium"}
      color={active ? "accent.default" : "fg.secondary"}
      bg={active ? "brand.subtle" : "transparent"}
      border="none"
      cursor="pointer"
      transition={transition.base}
      _hover={
        !active ? { bg: "bg.surfaceHover", color: "fg.primary" } : undefined
      }
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      {item.label}
    </Box>
  );
}

function NavGroup({
  title,
  items,
  value,
  onChange,
}: {
  title: string;
  items: NavItem[];
  value: SettingsSectionId;
  onChange: (section: SettingsSectionId) => void;
}) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="0.06em"
        mb="2"
        px="2"
      >
        {title}
      </Text>
      <Stack gap="0.5">
        {items.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={value === item.id}
            onClick={() => onChange(item.id)}
          />
        ))}
      </Stack>
    </Box>
  );
}

export function SettingsNav({
  value,
  onChange,
  showOrgGroup,
  showOrgDanger,
}: SettingsNavProps) {
  const orgItems = buildOrgItems(showOrgDanger);

  return (
    <Box
      as="nav"
      w="52"
      flexShrink="0"
      display={{ base: "none", lg: "block" }}
      aria-label="Settings sections"
    >
      <Stack gap="6">
        {showOrgGroup && (
          <NavGroup
            title="Organization"
            items={orgItems}
            value={value}
            onChange={onChange}
          />
        )}
        <NavGroup
          title="Account"
          items={ACCOUNT_ITEMS}
          value={value}
          onChange={onChange}
        />
      </Stack>
    </Box>
  );
}

export function SettingsMobileNav({
  value,
  onChange,
  showOrgGroup,
  showOrgDanger,
}: SettingsNavProps) {
  const orgItems = showOrgGroup ? buildOrgItems(showOrgDanger) : [];
  const items = [...orgItems, ...ACCOUNT_ITEMS];

  return (
    <Flex
      display={{ base: "flex", lg: "none" }}
      gap="2"
      mb="6"
      overflowX="auto"
      pb="1"
      css={{
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {items.map((item) => {
        const active = value === item.id;
        const isOrg = isOrgSettingsSection(item.id);
        return (
          <Box
            key={item.id}
            as="button"
            flexShrink="0"
            px="3"
            py="2"
            borderRadius="control"
            fontSize="sm"
            fontWeight={active ? "semibold" : "medium"}
            color={active ? "accent.default" : "fg.secondary"}
            bg={active ? "brand.subtle" : "bg.surfaceHover"}
            border="none"
            cursor="pointer"
            onClick={() => onChange(item.id)}
          >
            {isOrg ? `Org · ${item.label}` : item.label}
          </Box>
        );
      })}
    </Flex>
  );
}

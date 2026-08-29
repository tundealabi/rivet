import { Box, Button, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { IoBugSharp, IoCard, IoSettings } from "react-icons/io5";
import { MdSpaceDashboard } from "react-icons/md";
import { PiSignOut, PiUsersThreeFill } from "react-icons/pi";
import { TbFolderOpenFilled } from "react-icons/tb";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { getStoredUser } from "../../auth-api";
import { canViewBilling } from "../billing/billing-permissions";
import { useActiveOrg } from "../billing/use-active-org";
import { ColorModeToggle } from "../theme/color-mode";
import { OrgSwitcher } from "./OrgSwitcher";

function userInitials(firstName: string, lastName: string): string {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return initials || "?";
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: MdSpaceDashboard, path: "/dashboard" },
  { label: "Projects", icon: TbFolderOpenFilled, path: "/projects" },
  { label: "Issues", icon: IoBugSharp, path: "/issues" },
  { label: "Members", icon: PiUsersThreeFill, path: "/members" },
  { label: "Billing", icon: IoCard, path: "/billing" },
  { label: "Settings", icon: IoSettings, path: "/settings" },
];

const IMPLEMENTED_PATHS = new Set([
  "/dashboard",
  "/projects",
  "/issues",
  "/members",
  "/billing",
  "/settings",
]);

interface AppSidebarProps {
  onLogout: () => void;
  collapsed?: boolean;
}

export function AppSidebar({ onLogout, collapsed = false }: AppSidebarProps) {
  const { pathname } = useLocation();
  const { role } = useActiveOrg();
  const user = getStoredUser();

  return (
    <Flex
      as="aside"
      direction="column"
      w={collapsed ? "16" : "64"}
      h="100svh"
      position="sticky"
      top="0"
      alignSelf="flex-start"
      flexShrink="0"
      overflow="hidden"
      bg="bg.sidebar"
      borderRightWidth="1px"
      borderColor="border.default"
      display={{ base: "none", md: "flex" }}
      transition="width 0.2s ease"
    >
      <Box flexShrink="0">
        <OrgSwitcher collapsed={collapsed} />
      </Box>

      <Stack
        gap="1"
        flex="1"
        minH="0"
        overflowY="auto"
        p={collapsed ? "2" : "4"}
      >
        {NAV_ITEMS.map((item) => {
          if (item.path === "/billing" && !canViewBilling(role)) {
            return null;
          }

          const active =
            pathname === item.path ||
            (item.path === "/projects" && pathname.startsWith("/projects/")) ||
            (item.path === "/settings" && pathname.startsWith("/settings"));
          const implemented = IMPLEMENTED_PATHS.has(item.path);

          const content = collapsed ? (
            <Flex
              align="center"
              justify="center"
              px="2"
              py="2.5"
              borderRadius="control"
              cursor={implemented ? "pointer" : "default"}
              bg={active ? "brand.subtle" : "transparent"}
              color={active ? "accent.default" : "fg.secondary"}
              opacity={implemented ? 1 : 0.55}
              _hover={
                implemented && !active ? { bg: "bg.surfaceHover" } : undefined
              }
              transition="background 0.15s"
              title={item.label}
            >
              <item.icon size={19} />
            </Flex>
          ) : (
            <HStack
              gap="3"
              px="3"
              py="2.5"
              borderRadius="control"
              cursor={implemented ? "pointer" : "default"}
              bg={active ? "brand.subtle" : "transparent"}
              color={active ? "accent.default" : "fg.secondary"}
              fontWeight={active ? "semibold" : "medium"}
              opacity={implemented ? 1 : 0.55}
              _hover={
                implemented && !active ? { bg: "bg.surfaceHover" } : undefined
              }
              transition="background 0.15s"
            >
              <item.icon size={19} />
              <Text fontSize="sm">{item.label}</Text>
            </HStack>
          );

          return implemented ? (
            <RouterLink
              key={item.label}
              to={item.path}
              style={{ textDecoration: "none" }}
            >
              {content}
            </RouterLink>
          ) : (
            <Box key={item.label}>{content}</Box>
          );
        })}
      </Stack>

      <Stack
        gap="3"
        flexShrink="0"
        p={collapsed ? "2" : "4"}
        pt={collapsed ? "2" : "3"}
        borderTopWidth="1px"
        borderColor="border.default"
      >
        {!collapsed && (
          <Box
            p="3"
            borderRadius="card"
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.default"
          >
            <HStack gap="2.5">
              <Flex
                boxSize="9"
                align="center"
                justify="center"
                borderRadius="full"
                bg="brand.subtle"
                color="accent.default"
                fontWeight="bold"
                fontSize="sm"
                flexShrink="0"
              >
                {user ? userInitials(user.firstName, user.lastName) : "?"}
              </Flex>
              <Box minW="0">
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="fg.primary"
                  truncate
                >
                  {user ? `${user.firstName} ${user.lastName}` : "Unknown user"}
                </Text>
                <Text fontSize="xs" color="fg.muted" truncate>
                  {user?.email ?? ""}
                </Text>
              </Box>
            </HStack>
          </Box>
        )}

        <ColorModeToggle collapsed={collapsed} />

        {!collapsed && (
          <Button
            variant="outline"
            size="sm"
            borderRadius="control"
            borderColor="status.error"
            color="status.error"
            fontWeight="medium"
            justifyContent="flex-start"
            _hover={{
              bg: "danger.ghostHover",
              color: "status.error",
              borderColor: "status.error",
            }}
            onClick={onLogout}
          >
            <PiSignOut size={16} />
            Log out
          </Button>
        )}
      </Stack>
    </Flex>
  );
}

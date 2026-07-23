import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { PiSignOut } from "react-icons/pi";
import { useSearchParams } from "react-router-dom";

import { AppSidebar, useLogout } from "../components/app/AppSidebar";
import { useActiveOrg } from "../components/billing/use-active-org";
import { EASE_OUT, fadeIn } from "../components/issues/issues-motion";
import { MOCK_ROLE } from "../components/members/mock-members-data";
import { AppearanceSection } from "../components/settings/AppearanceSection";
import { DangerZoneSection } from "../components/settings/DangerZoneSection";
import { NotificationsSection } from "../components/settings/NotificationsSection";
import { OrganizationDangerZoneSection } from "../components/settings/OrganizationDangerZoneSection";
import { OrganizationGeneralSection } from "../components/settings/OrganizationGeneralSection";
import { OrganizationNotificationsSection } from "../components/settings/OrganizationNotificationsSection";
import { ProfileSection } from "../components/settings/ProfileSection";
import { SecuritySection } from "../components/settings/SecuritySection";
import { UnsavedChangesBanner } from "../components/settings/settings-card-ui";
import { SettingsNavigationProvider } from "../components/settings/settings-navigation-context";
import {
  canDeleteOrg,
  canViewOrgSettings,
} from "../components/settings/settings-permissions";
import type { SettingsSectionId } from "../components/settings/settings-types";
import { useSettingsUnsavedChangesRegistry } from "../components/settings/settings-unsaved-changes";
import {
  defaultSettingsSection,
  isOrgSettingsSection,
  SettingsMobileNav,
  SettingsNav,
} from "../components/settings/SettingsNav";
import { SettingsPageSkeleton } from "../components/settings/SettingsPageStates";
import { useAccountNotificationSettings } from "../components/settings/use-account-notification-queries";
import {
  useOrgGeneralSettings,
  useOrgNotificationSettings,
} from "../components/settings/use-org-settings-queries";
import { useUserProfile } from "../components/settings/use-profile-settings-queries";
import { useAccountDangerContext } from "../components/settings/use-settings-queries";

function useSectionQueryState(section: SettingsSectionId, orgId: string) {
  const profileQuery = useUserProfile();
  const accountNotificationsQuery = useAccountNotificationSettings(orgId);
  const orgGeneralQuery = useOrgGeneralSettings(orgId);
  const orgNotificationsQuery = useOrgNotificationSettings(orgId);
  const accountDangerQuery = useAccountDangerContext(orgId);

  return useMemo(() => {
    switch (section) {
      case "organization":
        return { isLoading: orgGeneralQuery.isLoading };
      case "organizationNotifications":
        return { isLoading: orgNotificationsQuery.isLoading };
      case "orgDanger":
        return { isLoading: orgGeneralQuery.isLoading };
      case "profile":
        return { isLoading: profileQuery.isLoading };
      case "appearance":
        return { isLoading: false };
      case "notifications":
        return { isLoading: accountNotificationsQuery.isLoading };
      case "danger":
        return {
          isLoading: profileQuery.isLoading || accountDangerQuery.isLoading,
        };
      case "security":
      default:
        return { isLoading: false };
    }
  }, [
    section,
    orgGeneralQuery.isLoading,
    orgNotificationsQuery.isLoading,
    profileQuery.isLoading,
    accountNotificationsQuery.isLoading,
    accountDangerQuery.isLoading,
  ]);
}

function SettingsPage() {
  const { orgId, orgName } = useActiveOrg();
  const [searchParams] = useSearchParams();
  const showOrgSettings = canViewOrgSettings(MOCK_ROLE);
  const showOrgDanger = canDeleteOrg(MOCK_ROLE);
  const logout = useLogout();
  const { hasUnsavedChanges } = useSettingsUnsavedChangesRegistry();

  const sectionFromQuery = searchParams.get("section");
  const initialSection: SettingsSectionId =
    sectionFromQuery === "profile" ||
    sectionFromQuery === "appearance" ||
    sectionFromQuery === "notifications" ||
    sectionFromQuery === "security" ||
    sectionFromQuery === "danger" ||
    sectionFromQuery === "organization" ||
    sectionFromQuery === "organizationNotifications" ||
    sectionFromQuery === "orgDanger"
      ? sectionFromQuery
      : defaultSettingsSection(showOrgSettings);

  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>(initialSection);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const sectionQuery = useSectionQueryState(activeSection, orgId);

  useEffect(() => {
    if (
      sectionFromQuery === "profile" ||
      sectionFromQuery === "appearance" ||
      sectionFromQuery === "notifications" ||
      sectionFromQuery === "security" ||
      sectionFromQuery === "danger" ||
      sectionFromQuery === "organization" ||
      sectionFromQuery === "organizationNotifications" ||
      sectionFromQuery === "orgDanger"
    ) {
      setActiveSection(sectionFromQuery);
    }
  }, [sectionFromQuery]);

  useEffect(() => {
    if (!showOrgSettings && isOrgSettingsSection(activeSection)) {
      setActiveSection("profile");
    }
    if (!showOrgDanger && activeSection === "orgDanger") {
      setActiveSection(showOrgSettings ? "organization" : "profile");
    }
  }, [showOrgSettings, showOrgDanger, activeSection]);

  useEffect(() => {
    if (!sectionQuery.isLoading) {
      setInitialLoadComplete(true);
    }
  }, [sectionQuery.isLoading]);

  const showInitialSkeleton = sectionQuery.isLoading && !initialLoadComplete;

  const renderSection = () => {
    switch (activeSection) {
      case "organization":
        return <OrganizationGeneralSection canManage={showOrgSettings} />;
      case "organizationNotifications":
        return <OrganizationNotificationsSection canManage={showOrgSettings} />;
      case "orgDanger":
        if (!showOrgDanger) return null;
        return <OrganizationDangerZoneSection role={MOCK_ROLE} />;
      case "profile":
        return <ProfileSection skipLoadingState />;
      case "appearance":
        return <AppearanceSection />;
      case "notifications":
        return <NotificationsSection />;
      case "security":
        return <SecuritySection />;
      case "danger":
        return <DangerZoneSection skipLoadingState />;
      default:
        return null;
    }
  };

  return (
    <SettingsNavigationProvider goToSection={setActiveSection}>
      <Flex minH="100svh" bg="bg.canvas">
        <AppSidebar onLogout={logout} />

        <Box
          flex="1"
          minW="0"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Flex
            as="header"
            align={{ base: "flex-start", lg: "center" }}
            justify="space-between"
            direction={{ base: "column", lg: "row" }}
            px={{ base: "5", md: "10" }}
            py="5"
            borderBottomWidth="1px"
            borderColor="border.default"
            bg="bg.surface"
            gap="4"
            flexShrink="0"
            boxShadow="0 1px 0 rgba(0,0,0,0.03)"
            animation={`rivet-fade-in 0.4s ${EASE_OUT} both`}
          >
            <Box>
              <Heading
                size="xl"
                color="fg.primary"
                letterSpacing="-0.03em"
                fontWeight="semibold"
              >
                Settings
              </Heading>
              <Text fontSize="sm" color="fg.secondary" mt="1" lineHeight="1.5">
                {showOrgSettings
                  ? `Manage ${orgName} and your personal account`
                  : "Manage your profile, notifications, and security"}
              </Text>
            </Box>

            <Button
              variant="outline"
              size="sm"
              borderRadius="control"
              borderColor="status.error"
              color="status.error"
              fontWeight="medium"
              display={{ base: "inline-flex", md: "none" }}
              _hover={{
                bg: "danger.ghostHover",
                color: "status.error",
                borderColor: "status.error",
              }}
              onClick={logout}
            >
              <PiSignOut size={16} />
              Log out
            </Button>
          </Flex>

          <Box
            px={{ base: "5", md: "10" }}
            py="8"
            flex="1"
            overflow="auto"
            {...fadeIn}
          >
            {hasUnsavedChanges && <UnsavedChangesBanner />}

            {showInitialSkeleton ? (
              <SettingsPageSkeleton />
            ) : (
              <>
                <SettingsMobileNav
                  value={activeSection}
                  onChange={setActiveSection}
                  showOrgGroup={showOrgSettings}
                  showOrgDanger={showOrgDanger}
                />
                <Flex gap={{ base: 0, lg: "10" }} align="flex-start">
                  <SettingsNav
                    value={activeSection}
                    onChange={setActiveSection}
                    showOrgGroup={showOrgSettings}
                    showOrgDanger={showOrgDanger}
                  />
                  <Box flex="1" minW="0">
                    {renderSection()}
                  </Box>
                </Flex>
              </>
            )}
          </Box>
        </Box>
      </Flex>
    </SettingsNavigationProvider>
  );
}

export default SettingsPage;

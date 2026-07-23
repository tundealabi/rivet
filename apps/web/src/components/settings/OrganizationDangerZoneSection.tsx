import { Box } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";

import { useActiveOrg } from "../billing/use-active-org";
import { fadeIn } from "../issues/issues-motion";
import { OrganizationDangerZone } from "./OrganizationDangerZone";
import { canDeleteOrg } from "./settings-permissions";
import {
  SettingsErrorState,
  SettingsSectionSkeleton,
} from "./SettingsPageStates";
import { SettingsSectionHeader } from "./SettingsSettingCard";
import { useOrgGeneralSettings } from "./use-org-settings-queries";

interface OrganizationDangerZoneSectionProps {
  role: OrganizationRole;
}

export function OrganizationDangerZoneSection({
  role,
}: OrganizationDangerZoneSectionProps) {
  const { orgId } = useActiveOrg();
  const settingsQuery = useOrgGeneralSettings(orgId);

  if (!canDeleteOrg(role)) {
    return null;
  }

  if (settingsQuery.isLoading) {
    return <SettingsSectionSkeleton />;
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return <SettingsErrorState onRetry={() => void settingsQuery.refetch()} />;
  }

  const orgName = settingsQuery.data.name;

  return (
    <Box maxW="2xl" css={fadeIn}>
      <SettingsSectionHeader
        breadcrumb="Organization"
        title="Danger zone"
        subtitle="Irreversible actions that affect your entire organization. Only the owner can perform these."
      />
      <OrganizationDangerZone orgId={orgId} orgName={orgName} role={role} />
    </Box>
  );
}

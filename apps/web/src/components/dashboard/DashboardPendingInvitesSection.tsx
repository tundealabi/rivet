import { Stack, Text } from "@chakra-ui/react";

import type { PendingInvite } from "../members/member-types";
import { ROLE_LABELS } from "../members/member-types";
import { formatExpiresLabel } from "../members/member-utils";
import {
  DashboardRowDivider,
  DashboardSection,
  DashboardSectionHeader,
} from "./DashboardSectionHeader";

interface DashboardPendingInvitesSectionProps {
  invites: PendingInvite[];
}

export function DashboardPendingInvitesSection({
  invites,
}: DashboardPendingInvitesSectionProps) {
  const rows = invites.slice(0, 5);

  return (
    <DashboardSection>
      <DashboardSectionHeader
        title="Pending invites"
        viewAllHref="/members?tab=pending"
        viewAllLabel="View all"
      />

      <Stack gap="0">
        {rows.map((invite, index) => {
          const expires = formatExpiresLabel(invite.expiresAt);

          return (
            <Stack key={invite.id} gap="0">
              {index > 0 && <DashboardRowDivider />}
              <Stack gap="0.5" py="3">
                <Text
                  fontSize="sm"
                  color="fg.primary"
                  fontWeight="medium"
                  truncate
                >
                  {invite.email}
                </Text>
                <Text fontSize="xs" color="fg.secondary">
                  {ROLE_LABELS[invite.role]} ·{" "}
                  <Text
                    as="span"
                    color={
                      expires.tone === "danger"
                        ? "status.error"
                        : expires.tone === "warning"
                          ? "status.warning"
                          : "fg.secondary"
                    }
                  >
                    {expires.label}
                  </Text>
                </Text>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </DashboardSection>
  );
}

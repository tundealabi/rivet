import { Text } from "@chakra-ui/react";
import { PiWrench } from "react-icons/pi";

import {
  getMaintenanceEta,
  getMaintenanceMessage,
} from "../components/errors/maintenance-mode";
import { StatePageShell } from "../components/errors/StatePageShell";

export default function MaintenancePage() {
  const customMessage = getMaintenanceMessage();
  const eta = getMaintenanceEta();

  return (
    <StatePageShell
      icon={<PiWrench size={28} />}
      iconBg="settings.unsaved.bg"
      iconColor="settings.unsaved.fg"
      title="We'll be right back"
      description={
        customMessage ??
        "Rivet is down for scheduled maintenance. We're deploying improvements and will be back online shortly."
      }
      actions={[
        {
          label: "Check status",
          onClick: () => window.location.reload(),
          variant: "primary",
        },
      ]}
    >
      {eta ? (
        <Text fontSize="sm" color="fg.secondary" mb="8">
          Estimated return:{" "}
          <Text as="span" fontWeight="medium" color="fg.primary">
            {eta}
          </Text>
        </Text>
      ) : null}
    </StatePageShell>
  );
}

import { Text } from "@chakra-ui/react";
import { PiLock } from "react-icons/pi";
import { useLocation } from "react-router-dom";

import { StatePageShell } from "../components/errors/StatePageShell";

interface AccessDeniedLocationState {
  from?: string;
  message?: string;
}

function formatRouteLabel(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return "this page";

  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function AccessDeniedPage() {
  const location = useLocation();
  const state = (location.state ?? {}) as AccessDeniedLocationState;
  const routeLabel = state.from ? formatRouteLabel(state.from) : null;

  const description =
    state.message ??
    (routeLabel ? (
      <>
        You don&apos;t have permission to access {routeLabel}. Contact an
        organization owner or admin if you think this is a mistake.
      </>
    ) : (
      <>
        You don&apos;t have permission to view this page. Contact an
        organization owner or admin if you need access.
      </>
    ));

  return (
    <StatePageShell
      code="403"
      icon={<PiLock size={28} />}
      title="Access denied"
      description={description}
      actions={[
        { label: "Back to projects", to: "/projects", variant: "primary" },
        { label: "Dashboard", to: "/dashboard", variant: "outline" },
      ]}
    >
      {state.from ? (
        <Text fontSize="xs" color="fg.muted" mb="6" fontFamily="mono">
          {state.from}
        </Text>
      ) : null}
    </StatePageShell>
  );
}

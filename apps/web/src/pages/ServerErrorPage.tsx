import { PiWarningCircle } from "react-icons/pi";

import { StatePageShell } from "../components/errors/StatePageShell";

interface ServerErrorPageProps {
  onRetry?: () => void;
}

export default function ServerErrorPage({ onRetry }: ServerErrorPageProps) {
  return (
    <StatePageShell
      code="500"
      icon={<PiWarningCircle size={28} />}
      iconBg="billing.error.bg"
      iconColor="status.error"
      title="Something went wrong"
      description="Rivet hit an unexpected error or our services are temporarily unavailable. Your work is safe — try again in a moment."
      actions={[
        ...(onRetry
          ? [
              {
                label: "Try again",
                onClick: onRetry,
                variant: "primary" as const,
              },
            ]
          : []),
        {
          label: "Back to projects",
          to: "/projects",
          variant: onRetry ? "outline" : "primary",
        },
      ]}
    />
  );
}

import { PiCompass } from "react-icons/pi";

import { StatePageShell } from "../components/errors/StatePageShell";

export default function NotFoundPage() {
  return (
    <StatePageShell
      code="404"
      icon={<PiCompass size={28} />}
      iconBg="brand.subtle"
      iconColor="accent.default"
      title="Page not found"
      description="The page you're looking for doesn't exist, was moved, or the link may be outdated."
      actions={[
        { label: "Back to projects", to: "/projects", variant: "primary" },
        { label: "Go home", to: "/", variant: "outline" },
      ]}
    />
  );
}

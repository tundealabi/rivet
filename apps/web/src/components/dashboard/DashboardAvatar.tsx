import { Flex } from "@chakra-ui/react";

interface DashboardAvatarProps {
  initials: string;
  size?: string;
  title?: string;
}

/** Org activity timeline avatar — legible in light and dark mode. */
export function DashboardAvatar({
  initials,
  size = "8",
  title,
}: DashboardAvatarProps) {
  return (
    <Flex
      boxSize={size}
      align="center"
      justify="center"
      borderRadius="full"
      bg="dashboard.avatar.bg"
      color="dashboard.avatar.fg"
      fontSize="xs"
      fontWeight="bold"
      flexShrink="0"
      title={title}
    >
      {initials}
    </Flex>
  );
}

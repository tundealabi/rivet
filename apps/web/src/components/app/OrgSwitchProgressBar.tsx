import { Box } from "@chakra-ui/react";

interface OrgSwitchProgressBarProps {
  active: boolean;
}

export function OrgSwitchProgressBar({ active }: OrgSwitchProgressBarProps) {
  if (!active) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      h="2px"
      zIndex="modal"
      pointerEvents="none"
      overflow="hidden"
    >
      <Box
        className="rivet-org-switch-progress"
        h="full"
        w="full"
        bg="accent.default"
        transformOrigin="left center"
      />
    </Box>
  );
}

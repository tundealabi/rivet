import { Box } from "@chakra-ui/react";

import { palette } from "./palette";

export function LandingGlowArcs() {
  return (
    <Box position="absolute" inset="0" overflow="hidden" pointerEvents="none">
      <Box
        position="absolute"
        top="-30%"
        right="-25%"
        w="70%"
        h="140%"
        borderRadius="full"
        bg={palette.brandSoft}
        opacity="0.22"
        filter="blur(90px)"
      />
      <Box
        position="absolute"
        top="-10%"
        right="-35%"
        w="55%"
        h="100%"
        borderRadius="full"
        bg={palette.brand}
        opacity="0.1"
        filter="blur(100px)"
      />
      <Box
        position="absolute"
        bottom="-70%"
        left="-30%"
        w="75%"
        h="120%"
        borderRadius="full"
        bg={palette.brand}
        opacity="0.12"
        filter="blur(100px)"
      />
      <Box
        position="absolute"
        bottom="-50%"
        left="-10%"
        w="50%"
        h="80%"
        borderRadius="full"
        bg={palette.brandSoft}
        opacity="0.18"
        filter="blur(80px)"
      />
      <Box
        position="absolute"
        top="-20%"
        left="40%"
        w="50%"
        h="50%"
        borderRadius="full"
        bg={palette.glowHighlight}
        opacity="0.7"
        filter="blur(100px)"
      />
    </Box>
  );
}

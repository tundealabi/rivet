import { Flex, HStack, Text } from "@chakra-ui/react";
import { PiNutFill } from "react-icons/pi";
import { Link as RouterLink } from "react-router-dom";

import { palette } from "./palette";

export function BrandMark() {
  return (
    <RouterLink to="/" style={{ textDecoration: "none" }}>
      <HStack gap="2">
        <Flex
          boxSize="7"
          align="center"
          justify="center"
          borderRadius="control"
          bg={palette.brand}
          color="white"
        >
          <PiNutFill size={17} />
        </Flex>
        <Text fontWeight="bold" color={palette.fg} letterSpacing="-0.02em">
          Rivet
        </Text>
      </HStack>
    </RouterLink>
  );
}

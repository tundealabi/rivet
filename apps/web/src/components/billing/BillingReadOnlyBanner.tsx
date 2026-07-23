import { Box, Flex, Text } from "@chakra-ui/react";
import { PiInfo } from "react-icons/pi";

import { fadeInUp } from "../issues/issues-motion";

export function BillingReadOnlyBanner() {
  return (
    <Box
      px={{ base: "5", md: "10" }}
      py="3"
      borderBottomWidth="1px"
      borderColor="border.default"
      bg="brand.subtle"
      flexShrink="0"
      {...fadeInUp}
    >
      <Flex align="center" gap="2.5">
        <Box color="accent.default" lineHeight="0" flexShrink="0">
          <PiInfo size={18} />
        </Box>
        <Text fontSize="sm" color="fg.secondary">
          You have read-only access to billing. Contact an Owner to make
          changes.
        </Text>
      </Flex>
    </Box>
  );
}

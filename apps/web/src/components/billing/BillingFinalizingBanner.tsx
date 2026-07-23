import { Box, Flex, Spinner, Text } from "@chakra-ui/react";

import { fadeInUp } from "../issues/issues-motion";

export function BillingFinalizingBanner() {
  return (
    <Box
      mb="6"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surfaceHover"
      px="5"
      py="3.5"
      {...fadeInUp}
    >
      <Flex align="center" gap="3">
        <Spinner size="sm" color="accent.default" />
        <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
          Finalizing your upgrade… this can take a moment.
        </Text>
      </Flex>
    </Box>
  );
}

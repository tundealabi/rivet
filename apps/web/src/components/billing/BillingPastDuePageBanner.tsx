import { Box, Button, Flex, Text } from "@chakra-ui/react";

interface BillingPastDuePageBannerProps {
  canManage: boolean;
  onFixPayment: () => void;
}

export function BillingPastDuePageBanner({
  canManage,
  onFixPayment,
}: BillingPastDuePageBannerProps) {
  return (
    <Box
      bg="billing.error.bg"
      borderBottomWidth="1px"
      borderColor="billing.error.border"
      px={{ base: "5", md: "10" }}
      py="3.5"
      flexShrink="0"
    >
      <Flex
        align={{ base: "stretch", sm: "center" }}
        justify="space-between"
        direction={{ base: "column", sm: "row" }}
        gap="3"
      >
        <Text
          fontSize="sm"
          color="billing.error.fg"
          fontWeight="medium"
          lineHeight="1.5"
        >
          Your last payment failed. Update your payment method to avoid losing
          access.
        </Text>
        {canManage && (
          <Button
            size="sm"
            flexShrink="0"
            borderRadius="control"
            bg="status.error"
            color="white"
            fontWeight="semibold"
            _hover={{ bg: "red.600" }}
            onClick={onFixPayment}
          >
            Fix payment
          </Button>
        )}
      </Flex>
    </Box>
  );
}

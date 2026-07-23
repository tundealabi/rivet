import { Box, Flex, Text } from "@chakra-ui/react";

interface DangerZoneCardProps {
  label: string;
  description: React.ReactNode;
  action: React.ReactNode;
}

export function DangerZoneCard({
  label,
  description,
  action,
}: DangerZoneCardProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border.default"
      borderLeftWidth="3px"
      borderLeftColor="danger.accent"
      borderRadius="card"
      bg="bg.surface"
      p={{ base: "5", md: "6" }}
    >
      <Flex
        direction={{ base: "column", sm: "row" }}
        align={{ base: "stretch", sm: "center" }}
        justify="space-between"
        gap="4"
      >
        <Box flex="1" minW="0">
          <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="1">
            {label}
          </Text>
          <Box fontSize="sm" color="fg.secondary" lineHeight="1.5">
            {description}
          </Box>
        </Box>
        <Box flexShrink="0">{action}</Box>
      </Flex>
    </Box>
  );
}

export function DeletionInProgressBanner({ message }: { message: string }) {
  return (
    <Box
      px="4"
      py="3"
      mb="4"
      borderWidth="1px"
      borderColor="border.default"
      borderLeftWidth="3px"
      borderLeftColor="danger.accent"
      borderRadius="control"
      bg="bg.surface"
    >
      <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
        {message}
      </Text>
    </Box>
  );
}

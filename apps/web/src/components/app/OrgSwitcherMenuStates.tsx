import { Box, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, var(--chakra-colors-bg-surfaceHover) 0%, var(--chakra-colors-bg-surface) 50%, var(--chakra-colors-bg-surfaceHover) 100%)",
  backgroundSize: "200% 100%",
  animation: "rivet-shimmer 1.4s ease-in-out infinite",
};

export function OrgSwitcherMenuSkeleton() {
  return (
    <Stack gap="0.5" px="1" py="1" aria-hidden>
      {[0, 1, 2].map((row) => (
        <HStack key={row} px="3" py="2" gap="3">
          <Skeleton boxSize="7" borderRadius="control" css={shimmerStyle} />
          <Box flex="1">
            <Skeleton h="3.5" w="70%" borderRadius="sm" css={shimmerStyle} />
            <Skeleton
              h="3"
              w="40%"
              mt="1.5"
              borderRadius="sm"
              css={shimmerStyle}
            />
          </Box>
        </HStack>
      ))}
    </Stack>
  );
}

export function OrgSwitcherMenuErrorMessage() {
  return (
    <Box px="3" py="2">
      <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
        Couldn&apos;t load organizations
      </Text>
    </Box>
  );
}

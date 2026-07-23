import { Box, Button, Flex, Text } from "@chakra-ui/react";

export function SaveButton({
  disabled,
  loading,
  label = "Save",
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  label?: string;
  onClick: () => void;
}) {
  return (
    <Flex align="center" gap="3">
      {loading && (
        <Text fontSize="xs" color="fg.muted" fontWeight="medium">
          Saving…
        </Text>
      )}
      <Button
        size="sm"
        borderRadius="control"
        bg="accent.default"
        color="white"
        fontWeight="semibold"
        _hover={{ bg: "accent.hover" }}
        disabled={disabled}
        loading={loading}
        onClick={onClick}
      >
        {label}
      </Button>
    </Flex>
  );
}

export function SavingIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Text fontSize="xs" color="fg.muted" fontWeight="medium">
      Saving…
    </Text>
  );
}

export function UnsavedChangesBanner() {
  return (
    <Box
      mb="4"
      px="3"
      py="2.5"
      borderRadius="control"
      bg="settings.unsaved.bg"
      borderWidth="1px"
      borderColor="settings.unsaved.border"
    >
      <Text fontSize="sm" color="settings.unsaved.fg" fontWeight="medium">
        You have unsaved changes
      </Text>
    </Box>
  );
}

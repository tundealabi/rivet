import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

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

/** Brief green border flash after a card save succeeds. */
export function useSaveSuccessFlash() {
  const [flashKey, setFlashKey] = useState(0);

  const triggerSuccessFlash = useCallback(() => {
    setFlashKey((key) => key + 1);
  }, []);

  return { flashKey, triggerSuccessFlash };
}

export const destructiveButtonProps = {
  solid: {
    bg: "status.error",
    color: "white",
    fontWeight: "medium" as const,
    borderRadius: "control" as const,
    _hover: { bg: "danger.hover" },
  },
  ghost: {
    variant: "ghost" as const,
    color: "status.error",
    fontWeight: "medium" as const,
    borderRadius: "control" as const,
    _hover: { color: "danger.hover", bg: "danger.ghostHover" },
  },
  outline: {
    variant: "outline" as const,
    color: "status.error",
    borderColor: "border.default",
    fontWeight: "medium" as const,
    borderRadius: "control" as const,
    _hover: { bg: "danger.ghostHover" },
  },
};

/** Tracks a server-side save error and clears it when the user edits the field again. */
export function useInlineSaveError() {
  const [saveError, setSaveError] = useState<string | null>(null);

  const clearSaveError = () => setSaveError(null);

  return { saveError, setSaveError, clearSaveError };
}

export function useClearErrorOnChange(
  clearSaveError: () => void,
  deps: unknown[]
) {
  useEffect(() => {
    clearSaveError();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear when tracked inputs change
  }, deps);
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

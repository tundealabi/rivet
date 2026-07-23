import { useCallback, useEffect, useState } from "react";

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

import { createContext, useContext, useEffect } from "react";

export interface UnsavedChangesContextValue {
  hasUnsavedChanges: boolean;
  registerDirty: (id: string, dirty: boolean) => void;
}

export const UnsavedChangesContext =
  createContext<UnsavedChangesContextValue | null>(null);

export function useUnsavedChangesRegistry() {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    throw new Error(
      "useUnsavedChangesRegistry must be used within UnsavedChangesProvider"
    );
  }
  return ctx;
}

/** Register a form or card as dirty so navigation actions can prompt before leaving. */
export function useUnsavedChanges(cardId: string, isDirty: boolean) {
  const { registerDirty } = useUnsavedChangesRegistry();

  useEffect(() => {
    registerDirty(cardId, isDirty);
    return () => registerDirty(cardId, false);
  }, [cardId, isDirty, registerDirty]);
}

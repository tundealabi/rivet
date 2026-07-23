import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface UnsavedChangesContextValue {
  hasUnsavedChanges: boolean;
  registerDirty: (id: string, dirty: boolean) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null
);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set());

  const registerDirty = useCallback((id: string, dirty: boolean) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      hasUnsavedChanges: dirtyIds.size > 0,
      registerDirty,
    }),
    [dirtyIds, registerDirty]
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

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

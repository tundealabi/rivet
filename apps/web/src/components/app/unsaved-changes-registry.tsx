import { type ReactNode, useCallback, useMemo, useState } from "react";

import { UnsavedChangesContext } from "./unsaved-changes-context";

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

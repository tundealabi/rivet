import { createContext, useContext, useEffect, useRef } from "react";

export interface IssueDetailShortcutHandlers {
  editDescription?: () => void;
  focusComment?: () => void;
  submitComment?: () => void;
  openStatusPicker?: () => void;
  openPriorityPicker?: () => void;
  openAssigneePicker?: () => void;
}

export interface IssueDetailShortcutsContextValue {
  register: (handlers: IssueDetailShortcutHandlers) => () => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  getHandlers: () => IssueDetailShortcutHandlers;
}

export const IssueDetailShortcutsContext =
  createContext<IssueDetailShortcutsContextValue | null>(null);

export function useIssueDetailShortcuts() {
  const ctx = useContext(IssueDetailShortcutsContext);
  if (!ctx) {
    throw new Error(
      "useIssueDetailShortcuts must be used within IssueDetailShortcutsProvider"
    );
  }
  return ctx;
}

export function useRegisterIssueDetailShortcuts(
  handlers: IssueDetailShortcutHandlers
) {
  const { register } = useIssueDetailShortcuts();
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    return register({
      editDescription: () => handlersRef.current.editDescription?.(),
      focusComment: () => handlersRef.current.focusComment?.(),
      submitComment: () => handlersRef.current.submitComment?.(),
      openStatusPicker: () => handlersRef.current.openStatusPicker?.(),
      openPriorityPicker: () => handlersRef.current.openPriorityPicker?.(),
      openAssigneePicker: () => handlersRef.current.openAssigneePicker?.(),
    });
  }, [register]);
}

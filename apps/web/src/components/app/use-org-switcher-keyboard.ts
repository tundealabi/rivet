import { useCallback, useEffect, useRef, useState } from "react";

export type OrgSwitcherMenuAction =
  | { kind: "org"; id: string; label: string }
  | { kind: "invitation"; id: string; label: string }
  | { kind: "create"; id: "create"; label: string; disabled?: boolean }
  | { kind: "manage-account"; id: "manage-account"; label: string }
  | { kind: "retry"; id: "retry"; label: string };

const TYPEAHEAD_RESET_MS = 700;

function isActionDisabled(action: OrgSwitcherMenuAction | undefined): boolean {
  return action?.kind === "create" && action.disabled === true;
}

interface UseOrgSwitcherKeyboardOptions {
  open: boolean;
  actions: OrgSwitcherMenuAction[];
  onActivate: (action: OrgSwitcherMenuAction) => void;
  onClose: () => void;
}

export function useOrgSwitcherKeyboard({
  open,
  actions,
  onActivate,
  onClose,
}: UseOrgSwitcherKeyboardOptions) {
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [typeahead, setTypeahead] = useState("");
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const typeaheadTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setHighlightIndex(0);
      setTypeahead("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHighlightIndex((current) => {
      if (actions.length === 0) return 0;
      if (current >= actions.length) {
        return findNextEnabledIndex(actions, actions.length - 1, 1);
      }
      if (isActionDisabled(actions[current])) {
        return findNextEnabledIndex(actions, current, 1);
      }
      return current;
    });
  }, [actions, open]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[highlightIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open]);

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current !== null) {
        window.clearTimeout(typeaheadTimerRef.current);
      }
    },
    []
  );

  const moveHighlight = useCallback(
    (delta: number) => {
      if (actions.length === 0) return;
      setHighlightIndex((current) =>
        findNextEnabledIndex(actions, current, delta)
      );
    },
    [actions]
  );

  const applyTypeahead = useCallback(
    (char: string) => {
      const nextQuery = `${typeahead}${char}`;
      setTypeahead(nextQuery);

      if (typeaheadTimerRef.current !== null) {
        window.clearTimeout(typeaheadTimerRef.current);
      }
      typeaheadTimerRef.current = window.setTimeout(() => {
        setTypeahead("");
        typeaheadTimerRef.current = null;
      }, TYPEAHEAD_RESET_MS);

      const normalized = nextQuery.toLowerCase();
      const matchIndex = actions.findIndex(
        (action) =>
          !isActionDisabled(action) &&
          action.label.toLowerCase().startsWith(normalized)
      );

      if (matchIndex >= 0) {
        setHighlightIndex(matchIndex);
      }
    },
    [actions, typeahead]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!open || actions.length === 0) return;

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          moveHighlight(event.key === "ArrowDown" ? 1 : -1);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          moveHighlight(1);
          return;
        case "ArrowUp":
          event.preventDefault();
          moveHighlight(-1);
          return;
        case "Enter":
        case " ": {
          event.preventDefault();
          const action = actions[highlightIndex];
          if (action && !isActionDisabled(action)) onActivate(action);
          return;
        }
        case "Escape":
          event.preventDefault();
          onClose();
          return;
        case "Home":
          event.preventDefault();
          setHighlightIndex(findNextEnabledIndex(actions, -1, 1));
          return;
        case "End":
          event.preventDefault();
          setHighlightIndex(findNextEnabledIndex(actions, actions.length, -1));
          return;
        default:
          if (
            event.key.length === 1 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey
          ) {
            event.preventDefault();
            applyTypeahead(event.key);
          }
      }
    },
    [
      actions,
      applyTypeahead,
      highlightIndex,
      moveHighlight,
      onActivate,
      onClose,
      open,
    ]
  );

  const registerItemRef = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      itemRefs.current[index] = node;
    },
    []
  );

  return {
    highlightIndex,
    handleKeyDown,
    registerItemRef,
    setHighlightIndex,
    typeahead,
  };
}

function findNextEnabledIndex(
  actions: OrgSwitcherMenuAction[],
  fromIndex: number,
  delta: number
): number {
  if (actions.length === 0) return 0;

  let index = fromIndex;
  for (let step = 0; step < actions.length; step += 1) {
    index =
      delta >= 0
        ? (index + 1 + actions.length) % actions.length
        : (index - 1 + actions.length) % actions.length;

    if (!isActionDisabled(actions[index])) return index;
  }

  return Math.max(0, fromIndex);
}

export function useOpenOrgSwitcherShortcut() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      event.preventDefault();
      window.dispatchEvent(new CustomEvent("rivet:command-palette"));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

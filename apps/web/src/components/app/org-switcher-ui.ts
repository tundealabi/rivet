/** Shared focus and surface styles for the org switcher. */

export const orgSwitcherFocusRing = {
  outline: "2px solid",
  outlineColor: "orgSwitcher.focusRing",
  outlineOffset: "-2px",
} as const;

export const orgSwitcherMenuItemFocusRing = {
  outline: "2px solid",
  outlineColor: "orgSwitcher.focusRing",
  outlineOffset: "-1px",
} as const;

export const orgSwitcherTriggerStyles = {
  w: "full" as const,
  border: "none" as const,
  bg: "transparent" as const,
  cursor: "pointer" as const,
  textAlign: "left" as const,
  transition: "background 0.12s ease, color 0.12s ease",
  _hover: {
    bg: "orgSwitcher.hover",
    "& [data-org-chevron]": { color: "fg.secondary" },
  },
  _active: { bg: "orgSwitcher.active" },
  _focusVisible: orgSwitcherFocusRing,
};

export const orgSwitcherMenuItemStyles = {
  w: "full" as const,
  px: "3" as const,
  py: "2" as const,
  gap: "3" as const,
  border: "none" as const,
  borderRadius: "control" as const,
  cursor: "pointer" as const,
  textAlign: "left" as const,
  transition: "background 0.12s ease",
  _focusVisible: orgSwitcherMenuItemFocusRing,
};

export function orgSwitcherItemBg(highlighted: boolean, active = false) {
  if (active) return "orgSwitcher.active";
  if (highlighted) return "orgSwitcher.highlighted";
  return "transparent";
}

export const ORG_SWITCHER_OPEN_EVENT = "rivet:open-org-switcher";

export function dispatchOpenOrgSwitcher() {
  window.dispatchEvent(new CustomEvent(ORG_SWITCHER_OPEN_EVENT));
}

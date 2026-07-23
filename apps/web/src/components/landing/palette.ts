import type { CSSProperties } from "react";

/** Landing colors are CSS variables so every section follows the mode toggle. */
export const palette = {
  canvas: "var(--landing-canvas)",
  surface: "var(--landing-surface)",
  brand: "var(--landing-brand)",
  brandHover: "var(--landing-brand-hover)",
  brandSoft: "var(--landing-brand-soft)",
  brandSubtle: "var(--landing-brand-subtle)",
  fg: "var(--landing-fg)",
  fgSecondary: "var(--landing-fg-secondary)",
  fgMuted: "var(--landing-fg-muted)",
  border: "var(--landing-border)",
  glowHighlight: "var(--landing-glow-highlight)",
} as const;

export const LIGHT_THEME = {
  "--landing-canvas": "#F7F7FB",
  "--landing-surface": "#FFFFFF",
  "--landing-brand": "#4F46E5",
  "--landing-brand-hover": "#4338CA",
  "--landing-brand-soft": "#818CF8",
  "--landing-brand-subtle": "#EEF2FF",
  "--landing-fg": "#111111",
  "--landing-fg-secondary": "#52525B",
  "--landing-fg-muted": "#71717A",
  "--landing-border": "#E4E4EC",
  "--landing-glow-highlight": "#FFFFFF",
} as CSSProperties;

export const DARK_THEME = {
  "--landing-canvas": "#09090B",
  "--landing-surface": "#18181B",
  "--landing-brand": "#6366F1",
  "--landing-brand-hover": "#818CF8",
  "--landing-brand-soft": "#818CF8",
  "--landing-brand-subtle": "rgba(79, 70, 229, 0.16)",
  "--landing-fg": "#FAFAFA",
  "--landing-fg-secondary": "#D4D4D8",
  "--landing-fg-muted": "#A1A1AA",
  "--landing-border": "#27272A",
  "--landing-glow-highlight": "#18181B",
} as CSSProperties;

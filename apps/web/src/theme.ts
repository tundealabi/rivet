// src/theme.ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          500: { value: "#4F46E5" },
          600: { value: "#4338CA" },
          subtle: { value: "#EEF2FF" },
          dark: { value: "#818CF8" },
        },
        status: {
          success: { value: "#16A34A" },
          warning: { value: "#D97706" },
          error: { value: "#DC2626" },
          info: { value: "#2563EB" },
        },
        priority: {
          low: { value: "#9CA3AF" },
          medium: { value: "#2563EB" },
          high: { value: "#EA580C" },
          critical: { value: "#DC2626" },
        },
      },
      fonts: {
        heading: { value: `'Inter', sans-serif` },
        body: { value: `'Inter', sans-serif` },
      },
      radii: {
        card: { value: "16px" },
        control: { value: "10px" },
        badge: { value: "999px" },
      },
      shadows: {
        subtle: { value: "0 1px 2px rgba(0,0,0,.04)" },
        hover: { value: "0 6px 18px rgba(0,0,0,.06)" },
        drawerLift: { value: "-6px 0 18px rgba(0,0,0,.06)" },
        card: {
          value: "0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.03)",
        },
        elevated: { value: "0 8px 30px rgba(0,0,0,.08)" },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          canvas: { value: { base: "#FCFCFD", _dark: "#09090B" } },
          surface: { value: { base: "#FFFFFF", _dark: "#18181B" } },
          surfaceHover: { value: { base: "#F8F9FA", _dark: "#1F1F23" } },
          sidebar: { value: { base: "#FAFAFB", _dark: "#111113" } },
        },
        fg: {
          primary: { value: { base: "#111111", _dark: "#FAFAFA" } },
          secondary: { value: { base: "#52525B", _dark: "#D4D4D8" } },
          muted: { value: { base: "#A1A1AA", _dark: "#A1A1AA" } },
        },
        border: {
          default: { value: { base: "#ECEEF2", _dark: "#27272A" } },
          divider: { value: { base: "#F3F4F6", _dark: "#1F1F23" } },
        },
        accent: {
          default: { value: { base: "#4F46E5", _dark: "#818CF8" } },
          hover: { value: { base: "#4338CA", _dark: "#6366F1" } },
        },
        danger: {
          accent: {
            value: {
              base: "rgba(220, 38, 38, 0.35)",
              _dark: "rgba(248, 113, 113, 0.32)",
            },
          },
          hover: { value: { base: "#B91C1C", _dark: "#EF4444" } },
          ghostHover: {
            value: { base: "#FEF2F2", _dark: "rgba(220, 38, 38, 0.12)" },
          },
        },
        settings: {
          unsaved: {
            bg: {
              value: { base: "#FFFBEB", _dark: "rgba(217, 119, 6, 0.14)" },
            },
            border: {
              value: { base: "#FDE68A", _dark: "rgba(217, 119, 6, 0.35)" },
            },
            fg: { value: { base: "#92400E", _dark: "#FBBF24" } },
          },
        },
        orgSwitcher: {
          hover: { value: { base: "#F4F4F5", _dark: "#1F1F23" } },
          active: {
            value: { base: "#EEF2FF", _dark: "rgba(129, 140, 248, 0.12)" },
          },
          highlighted: { value: { base: "#F4F4F5", _dark: "#27272A" } },
          focusRing: {
            value: {
              base: "rgba(79, 70, 229, 0.45)",
              _dark: "rgba(129, 140, 248, 0.45)",
            },
          },
        },
        billing: {
          paid: {
            bg: {
              value: { base: "#DCFCE7", _dark: "rgba(22, 163, 74, 0.16)" },
            },
            fg: { value: { base: "#16A34A", _dark: "#4ADE80" } },
          },
          pending: {
            bg: { value: { base: "#F4F4F5", _dark: "#27272A" } },
            fg: { value: { base: "#71717A", _dark: "#A1A1AA" } },
          },
          failed: {
            bg: {
              value: { base: "#FEE2E2", _dark: "rgba(220, 38, 38, 0.16)" },
            },
            fg: { value: { base: "#DC2626", _dark: "#F87171" } },
          },
          warning: {
            bg: {
              value: { base: "#FFFBEB", _dark: "rgba(217, 119, 6, 0.14)" },
            },
            border: {
              value: { base: "#FDE68A", _dark: "rgba(217, 119, 6, 0.35)" },
            },
            fg: { value: { base: "#92400E", _dark: "#FBBF24" } },
          },
          error: {
            bg: {
              value: { base: "#FEF2F2", _dark: "rgba(220, 38, 38, 0.12)" },
            },
            border: {
              value: { base: "#FECACA", _dark: "rgba(220, 38, 38, 0.3)" },
            },
            fg: { value: { base: "#991B1B", _dark: "#FCA5A5" } },
          },
          success: {
            bg: {
              value: { base: "#F0FDF4", _dark: "rgba(22, 163, 74, 0.12)" },
            },
            border: {
              value: { base: "#BBF7D0", _dark: "rgba(22, 163, 74, 0.3)" },
            },
          },
          progress: {
            track: { value: { base: "#F3F4F6", _dark: "#27272A" } },
            fill: { value: { base: "#4F46E5", _dark: "#818CF8" } },
            fillNear: { value: { base: "#6366F1", _dark: "#A5B4FC" } },
            fillOver: { value: { base: "#DC2626", _dark: "#F87171" } },
          },
        },
        dashboard: {
          avatar: {
            bg: {
              value: { base: "#EEF2FF", _dark: "rgba(129, 140, 248, 0.18)" },
            },
            fg: { value: { base: "#4F46E5", _dark: "#A5B4FC" } },
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);

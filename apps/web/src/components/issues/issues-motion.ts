/** Shared motion tokens for the Issues workspace. */

export const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
export const EASE_SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export const transition = {
  fast: `all 0.15s ${EASE_OUT}`,
  base: `all 0.22s ${EASE_OUT}`,
  slow: `all 0.35s ${EASE_OUT}`,
  transform: `transform 0.22s ${EASE_OUT}, box-shadow 0.22s ${EASE_OUT}`,
};

export const fadeIn = {
  animation: `rivet-fade-in 0.35s ${EASE_OUT} both`,
};

export const fadeInUp = {
  animation: `rivet-fade-in-up 0.4s ${EASE_OUT} both`,
};

export const scaleIn = {
  animation: `rivet-scale-in 0.3s ${EASE_OUT} both`,
};

export function stagger(index: number, stepMs = 35, maxMs = 280) {
  return {
    animationDelay: `${Math.min(index * stepMs, maxMs)}ms`,
  };
}

export const interactiveCard = {
  transition: transition.transform,
  _hover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.07)",
  },
  _active: {
    transform: "translateY(0)",
  },
};

export const focusRing = {
  _focusVisible: {
    outline: "2px solid",
    outlineColor: "accent.default",
    outlineOffset: "2px",
  },
};

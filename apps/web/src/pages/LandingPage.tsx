import { Box } from "@chakra-ui/react";
import { useEffect } from "react";

import {
  LandingFaq,
  LandingFooter,
  LandingGlowArcs,
  LandingHero,
  LandingHowItWorks,
  LandingNavbar,
  LandingPricing,
  LandingThemeScope,
  LandingValueProp,
} from "../components/landing";
import { scrollToLandingSection } from "../components/landing/landing-scroll";

export default function LandingPage() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    requestAnimationFrame(() => {
      scrollToLandingSection(hash);
    });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) scrollToLandingSection(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <LandingThemeScope>
      <LandingGlowArcs />

      <Box position="relative" zIndex="1">
        <LandingNavbar />
        <LandingHero />
        <LandingValueProp />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingFaq />
        <LandingFooter />
      </Box>
    </LandingThemeScope>
  );
}

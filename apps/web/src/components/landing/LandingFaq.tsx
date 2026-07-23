import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useState } from "react";
import { PiCaretDown } from "react-icons/pi";

import { palette } from "./palette";

const FAQS = [
  {
    question: "How do I get started with Rivet?",
    answer:
      "Sign up for a free account, create your workspace, and invite your teammates. You can set up your first project and start tracking issues in under five minutes.",
  },
  {
    question: "Can I upgrade my plan later?",
    answer:
      "Yes. You can upgrade or downgrade at any time from your billing settings, and the change takes effect immediately with prorated charges.",
  },
  {
    question: "Is there a contract?",
    answer:
      "No. All plans are billed month-to-month with no long-term commitment, and you can cancel whenever you like.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major debit and credit cards, as well as bank transfers for Team customers.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "You can reach our support team via in-app chat or email around the clock. Pro and Team plans get priority response times.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Your data is encrypted in transit and at rest, backed up daily, and never shared with third parties.",
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Box borderBottomWidth="1px" borderColor={palette.border}>
      <Flex
        as="button"
        w="full"
        align="center"
        justify="space-between"
        textAlign="left"
        py="5"
        cursor="pointer"
        gap="4"
        onClick={onToggle}
      >
        <Text fontSize="sm" fontWeight="medium" color={palette.fg}>
          {question}
        </Text>
        <Box
          color={palette.fgMuted}
          flexShrink="0"
          transform={isOpen ? "rotate(180deg)" : "none"}
          transition="transform 0.2s"
        >
          <PiCaretDown size={16} />
        </Box>
      </Flex>
      <Box
        display="grid"
        gridTemplateRows={isOpen ? "1fr" : "0fr"}
        transition="grid-template-rows 0.25s ease"
      >
        <Box overflow="hidden">
          <Text fontSize="sm" color={palette.fgMuted} lineHeight="1.7" pb="5">
            {answer}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Box as="section" id="faq" py={{ base: "20", md: "28" }} px="6">
      <Flex
        maxW="6xl"
        mx="auto"
        direction={{ base: "column", md: "row" }}
        gap={{ base: "10", md: "20" }}
      >
        <Heading
          flex="1"
          maxW={{ md: "xs" }}
          color={palette.fg}
          fontSize={{ base: "3xl", md: "4xl" }}
          lineHeight="1.15"
          letterSpacing="-0.03em"
          fontWeight="medium"
        >
          Frequently
          <br />
          Asked
          <br />
          Questions
        </Heading>

        <Box flex="1.4">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </Box>
      </Flex>
    </Box>
  );
}

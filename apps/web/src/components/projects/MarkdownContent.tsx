/** Lightweight markdown renderer for project README-style content. */
import { Box, List, Text } from "@chakra-ui/react";
import { Fragment } from "react";

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text as="strong" key={index} fontWeight="semibold" color="fg.primary">
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function MarkdownBlock({ block }: { block: string }) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("## ")) {
    return (
      <Text
        as="h3"
        fontSize="lg"
        fontWeight="semibold"
        color="fg.primary"
        mt="6"
        mb="2"
        letterSpacing="-0.02em"
      >
        {renderInline(trimmed.slice(3))}
      </Text>
    );
  }

  if (trimmed.startsWith("# ")) {
    return (
      <Text
        as="h2"
        fontSize="xl"
        fontWeight="semibold"
        color="fg.primary"
        mt="6"
        mb="2"
        letterSpacing="-0.02em"
      >
        {renderInline(trimmed.slice(2))}
      </Text>
    );
  }

  const lines = trimmed.split("\n");
  if (lines.every((line) => line.startsWith("- "))) {
    return (
      <List.Root
        gap="1.5"
        pl="4"
        mt="2"
        mb="2"
        fontSize="md"
        color="fg.secondary"
      >
        {lines.map((line) => (
          <List.Item key={line} _marker={{ color: "fg.muted" }}>
            {renderInline(line.slice(2))}
          </List.Item>
        ))}
      </List.Root>
    );
  }

  return (
    <Text fontSize="md" color="fg.secondary" lineHeight="1.75" mb="3">
      {renderInline(trimmed)}
    </Text>
  );
}

export function MarkdownContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <Box maxW="2xl">
      {blocks.map((block, index) => (
        <MarkdownBlock key={index} block={block} />
      ))}
    </Box>
  );
}

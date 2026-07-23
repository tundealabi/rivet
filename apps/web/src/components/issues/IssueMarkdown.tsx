/** Markdown renderer for issue descriptions and comments. */
import { Box, Code, Link, List, Text } from "@chakra-ui/react";
import { Fragment } from "react";

function renderInline(text: string): React.ReactNode[] {
  const tokenPattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenPattern);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text as="strong" key={index} fontWeight="semibold" color="fg.primary">
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <Text as="em" key={index} fontStyle="italic">
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return (
        <Text as="s" key={index} color="fg.muted">
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Code
          key={index}
          fontSize="0.85em"
          px="1.5"
          py="0.5"
          borderRadius="sm"
          bg="bg.surfaceHover"
        >
          {part.slice(1, -1)}
        </Code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <Link
          key={index}
          href={linkMatch[2]}
          color="accent.default"
          fontWeight="medium"
          _hover={{ textDecoration: "underline" }}
        >
          {linkMatch[1]}
        </Link>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function MarkdownBlock({ block }: { block: string }) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    const code = lines
      .slice(1, lines[lines.length - 1] === "```" ? -1 : undefined)
      .join("\n");
    return (
      <Box
        as="pre"
        my="3"
        p="3"
        borderRadius="control"
        bg="gray.900"
        color="gray.100"
        fontSize="sm"
        overflowX="auto"
        fontFamily="mono"
      >
        <Code bg="transparent" color="inherit" whiteSpace="pre-wrap">
          {code}
        </Code>
      </Box>
    );
  }

  if (trimmed.startsWith("## ")) {
    return (
      <Text
        as="h3"
        fontSize="md"
        fontWeight="semibold"
        color="fg.primary"
        mt="4"
        mb="2"
      >
        {renderInline(trimmed.slice(3))}
      </Text>
    );
  }

  if (trimmed.startsWith("# ")) {
    return (
      <Text
        as="h2"
        fontSize="lg"
        fontWeight="semibold"
        color="fg.primary"
        mt="4"
        mb="2"
      >
        {renderInline(trimmed.slice(2))}
      </Text>
    );
  }

  const lines = trimmed.split("\n");
  if (
    lines.every(
      (line) => line.startsWith("- [ ] ") || line.startsWith("- [x] ")
    )
  ) {
    return (
      <List.Root gap="1.5" pl="1" my="2" fontSize="sm" color="fg.secondary">
        {lines.map((line) => {
          const checked = line.startsWith("- [x] ");
          const label = line.slice(6);
          return (
            <List.Item key={line} display="flex" gap="2" listStyleType="none">
              <Box as="span" color="fg.muted">
                {checked ? "☑" : "☐"}
              </Box>
              {renderInline(label)}
            </List.Item>
          );
        })}
      </List.Root>
    );
  }

  if (lines.every((line) => line.startsWith("- "))) {
    return (
      <List.Root gap="1.5" pl="4" my="2" fontSize="sm" color="fg.secondary">
        {lines.map((line) => (
          <List.Item key={line} _marker={{ color: "fg.muted" }}>
            {renderInline(line.slice(2))}
          </List.Item>
        ))}
      </List.Root>
    );
  }

  return (
    <Text fontSize="sm" color="fg.secondary" lineHeight="1.7" mb="2">
      {renderInline(trimmed)}
    </Text>
  );
}

export function IssueMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);
  return (
    <Box>
      {blocks.map((block, index) => (
        <MarkdownBlock key={index} block={block} />
      ))}
    </Box>
  );
}

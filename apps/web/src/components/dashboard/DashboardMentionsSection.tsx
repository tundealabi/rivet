import { Stack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { issueDetailPath } from "../issues/issue-detail-actions";
import {
  formatActivityTimestamp,
  formatMentionLine,
} from "./dashboard-content";
import type { DashboardMention } from "./dashboard-types";
import {
  DashboardRowDivider,
  DashboardSection,
  DashboardSectionHeader,
} from "./DashboardSectionHeader";

interface DashboardMentionsSectionProps {
  mentions: DashboardMention[];
}

export function DashboardMentionsSection({
  mentions,
}: DashboardMentionsSectionProps) {
  const navigate = useNavigate();
  const rows = mentions.slice(0, 6);

  return (
    <DashboardSection>
      <DashboardSectionHeader title="Mentions" />

      <Stack gap="0">
        {rows.map((mention, index) => (
          <Stack key={mention.id} gap="0">
            {index > 0 && <DashboardRowDivider />}
            <Text
              fontSize="sm"
              color="fg.secondary"
              py="3"
              cursor="pointer"
              lineHeight="1.5"
              borderRadius="control"
              mx={{ base: "-2", md: "-3" }}
              px={{ base: "2", md: "3" }}
              transition="background 0.15s"
              _hover={{ bg: "bg.surfaceHover", color: "fg.primary" }}
              onClick={() =>
                void navigate(
                  issueDetailPath(mention.projectId, mention.issueId)
                )
              }
            >
              {formatMentionLine(mention)}
              <Text as="span" color="fg.muted">
                {" "}
                · {mention.issueTitle} ·{" "}
                {formatActivityTimestamp(mention.timestamp)}
              </Text>
            </Text>
          </Stack>
        ))}
      </Stack>
    </DashboardSection>
  );
}

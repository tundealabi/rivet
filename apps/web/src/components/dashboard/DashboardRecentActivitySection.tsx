import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { formatActivityTimestamp } from "./dashboard-content";
import type { OrgActivityEvent } from "./dashboard-types";
import { DashboardAvatar } from "./DashboardAvatar";
import {
  DashboardSection,
  DashboardSectionEmpty,
  DashboardSectionHeader,
} from "./DashboardSectionHeader";

interface DashboardRecentActivitySectionProps {
  events: OrgActivityEvent[];
  error?: boolean;
  onRetry?: () => void;
}

export function DashboardRecentActivitySection({
  events,
  error = false,
  onRetry,
}: DashboardRecentActivitySectionProps) {
  const navigate = useNavigate();

  return (
    <DashboardSection>
      <DashboardSectionHeader title="Recent activity" viewAllHref="/issues" />

      {error ? (
        <Box py="2">
          <Text fontSize="sm" color="fg.secondary">
            Couldn&apos;t load recent activity.
          </Text>
          {onRetry && (
            <Button
              mt="3"
              size="sm"
              variant="outline"
              borderRadius="control"
              onClick={onRetry}
            >
              Try again
            </Button>
          )}
        </Box>
      ) : events.length === 0 ? (
        <DashboardSectionEmpty message="No recent activity yet." />
      ) : (
        <Stack gap="0">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            const time = formatActivityTimestamp(event.timestamp);

            return (
              <Flex
                key={event.id}
                gap="3"
                align="stretch"
                cursor="pointer"
                borderRadius="control"
                mx={{ base: "-2", md: "-3" }}
                px={{ base: "2", md: "3" }}
                py="1"
                transition="background 0.15s"
                _hover={{ bg: "bg.surfaceHover" }}
                onClick={() => void navigate(event.href)}
              >
                <Flex direction="column" align="center" w="8" flexShrink="0">
                  <DashboardAvatar initials={event.actorInitials} size="8" />
                  {!isLast && (
                    <Box
                      w="1px"
                      flex="1"
                      minH="4"
                      bg="border.divider"
                      mt="2"
                      mb="1"
                    />
                  )}
                </Flex>

                <Box pb={isLast ? "1" : "4"} pt="0.5" minW="0" flex="1">
                  <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                    <Text as="span" color="fg.primary">
                      {event.lead}
                    </Text>
                    {event.detail && (
                      <>
                        {" — "}
                        <Text as="span" color="fg.muted">
                          {event.detail}
                        </Text>
                      </>
                    )}
                    {event.projectKey && (
                      <Text
                        as="span"
                        color="fg.muted"
                        fontFamily="mono"
                        fontSize="xs"
                      >
                        {" "}
                        · {event.projectKey}
                      </Text>
                    )}
                    <Text as="span" color="fg.muted">
                      {" · "}
                      {time}
                    </Text>
                  </Text>
                </Box>
              </Flex>
            );
          })}
        </Stack>
      )}
    </DashboardSection>
  );
}

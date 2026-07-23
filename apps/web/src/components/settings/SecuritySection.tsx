import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import toast from "react-hot-toast";
import { PiDesktop, PiDeviceMobile, PiShieldCheck } from "react-icons/pi";

import { fadeIn } from "../issues/issues-motion";
import type { ActiveSession, SecurityActivityEvent } from "./settings-types";
import {
  SettingsErrorState,
  SettingsSectionSkeleton,
} from "./SettingsPageStates";
import {
  SettingsSectionHeader,
  SettingsSettingCard,
} from "./SettingsSettingCard";
import {
  useRevokeAllOtherSessionsMutation,
  useRevokeSessionMutation,
  useSecuritySettings,
} from "./use-security-settings-queries";

function formatSessionLastActive(date: Date, isCurrent: boolean): string {
  if (isCurrent) return "Active now";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function formatActivityTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "just now";
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function SessionDeviceIcon({ label }: { label: string }) {
  const isMobile = /iphone|android|mobile|ipad/i.test(label);
  const Icon = isMobile ? PiDeviceMobile : PiDesktop;

  return (
    <Flex
      boxSize="9"
      align="center"
      justify="center"
      borderRadius="control"
      bg="bg.surfaceHover"
      color="fg.muted"
      flexShrink="0"
    >
      <Icon size={18} />
    </Flex>
  );
}

function ActiveSessionsCard({ sessions }: { sessions: ActiveSession[] }) {
  const revokeSession = useRevokeSessionMutation();
  const revokeAllOthers = useRevokeAllOtherSessionsMutation();

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const hasOtherSessions = otherSessions.length > 0;

  const handleRevoke = (sessionId: string, deviceLabel: string) => {
    revokeSession.mutate(sessionId, {
      onSuccess: () => toast.success(`Signed out of ${deviceLabel}.`),
      onError: () => toast.error("Couldn't sign out session — try again"),
    });
  };

  const handleRevokeAll = () => {
    revokeAllOthers.mutate(undefined, {
      onSuccess: () => toast.success("Signed out of all other devices."),
      onError: () => toast.error("Couldn't sign out other devices — try again"),
    });
  };

  return (
    <SettingsSettingCard>
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="4">
        Active sessions
      </Text>

      <Stack gap="0">
        {sessions.map((session, index) => (
          <Flex
            key={session.id}
            align={{ base: "flex-start", sm: "center" }}
            justify="space-between"
            gap="4"
            py="4"
            borderTopWidth={index === 0 ? "0" : "1px"}
            borderColor="border.default"
            _first={{ pt: 0 }}
            _last={{ pb: 0 }}
          >
            <Flex align="flex-start" gap="3" flex="1" minW="0">
              <SessionDeviceIcon label={session.deviceLabel} />
              <Box minW="0">
                <HStack gap="2" mb="0.5" flexWrap="wrap">
                  <Text fontSize="sm" fontWeight="medium" color="fg.primary">
                    {session.deviceLabel}
                  </Text>
                  {session.isCurrent && (
                    <Badge
                      px="1.5"
                      py="0"
                      borderRadius="badge"
                      bg="brand.subtle"
                      color="accent.default"
                      fontSize="2xs"
                      fontWeight="medium"
                    >
                      This device
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
                  {session.location}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt="0.5">
                  {formatSessionLastActive(
                    session.lastActiveAt,
                    session.isCurrent
                  )}
                </Text>
              </Box>
            </Flex>

            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                borderRadius="control"
                fontWeight="medium"
                color="fg.secondary"
                flexShrink="0"
                loading={
                  revokeSession.isPending &&
                  revokeSession.variables === session.id
                }
                onClick={() => handleRevoke(session.id, session.deviceLabel)}
              >
                Sign out
              </Button>
            )}
          </Flex>
        ))}
      </Stack>

      {hasOtherSessions && (
        <Box mt="5" pt="4" borderTopWidth="1px" borderColor="border.default">
          <Button
            variant="ghost"
            size="sm"
            borderRadius="control"
            fontWeight="medium"
            color="fg.secondary"
            loading={revokeAllOthers.isPending}
            onClick={handleRevokeAll}
          >
            Sign out of all other devices
          </Button>
        </Box>
      )}
    </SettingsSettingCard>
  );
}

function TwoFactorCard({ enabled }: { enabled: boolean }) {
  return (
    <SettingsSettingCard>
      <Flex
        direction={{ base: "column", sm: "row" }}
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        gap="4"
      >
        <Box flex="1">
          <HStack gap="2" mb="1">
            <PiShieldCheck size={18} color="var(--chakra-colors-fg-muted)" />
            <Text fontSize="sm" fontWeight="medium" color="fg.primary">
              Two-factor authentication
            </Text>
          </HStack>
          <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
            {enabled ? "Enabled" : "Not enabled"}
          </Text>
          <Text fontSize="sm" color="fg.muted" mt="2" lineHeight="1.5">
            Add an extra layer of security to your account with an authenticator
            app.
          </Text>
        </Box>

        <HStack gap="2" flexShrink="0">
          <Badge
            px="1.5"
            py="0"
            borderRadius="badge"
            bg="bg.surfaceHover"
            color="fg.muted"
            fontSize="2xs"
            fontWeight="medium"
          >
            Coming soon
          </Badge>
          <Button
            size="sm"
            borderRadius="control"
            bg="accent.default"
            color="white"
            fontWeight="semibold"
            disabled
          >
            Enable 2FA
          </Button>
        </HStack>
      </Flex>
    </SettingsSettingCard>
  );
}

function SecurityActivityCard({
  activity,
}: {
  activity: SecurityActivityEvent[];
}) {
  if (activity.length === 0) return null;

  return (
    <SettingsSettingCard>
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="4">
        Recent security activity
      </Text>

      <Stack gap="0">
        {activity.map((event, index) => (
          <Flex
            key={event.id}
            align="center"
            py="3.5"
            borderTopWidth={index === 0 ? "0" : "1px"}
            borderColor="border.default"
            _first={{ pt: 0 }}
            _last={{ pb: 0 }}
          >
            <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
              {event.description}
              <Text as="span" color="fg.muted">
                {" "}
                · {formatActivityTime(event.occurredAt)}
              </Text>
            </Text>
          </Flex>
        ))}
      </Stack>
    </SettingsSettingCard>
  );
}

export function SecuritySection() {
  const securityQuery = useSecuritySettings();
  const settings = securityQuery.data;

  if (securityQuery.isLoading) {
    return <SettingsSectionSkeleton />;
  }

  if (securityQuery.isError || !settings) {
    return <SettingsErrorState onRetry={() => void securityQuery.refetch()} />;
  }

  return (
    <Box maxW="2xl" css={fadeIn}>
      <SettingsSectionHeader
        breadcrumb="Account"
        title="Security"
        subtitle="Manage sessions and account access"
      />

      <Stack gap="4">
        <ActiveSessionsCard sessions={settings.sessions} />
        <TwoFactorCard enabled={settings.mfaEnabled} />
        <SecurityActivityCard activity={settings.activity} />
      </Stack>
    </Box>
  );
}

import {
  Box,
  Checkbox,
  Field,
  Flex,
  Input,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useActiveOrg } from "../billing/use-active-org";
import { fadeIn } from "../issues/issues-motion";
import {
  SaveButton,
  useClearErrorOnChange,
  useInlineSaveError,
  useSaveSuccessFlash,
} from "./settings-card-ui";
import type {
  OrgDefaultNotificationEvents,
  OrgNotificationSettings,
} from "./settings-types";
import { useSettingsUnsavedChanges } from "./settings-unsaved-changes";
import {
  SettingsErrorState,
  SettingsPermissionDeniedState,
  SettingsSectionSkeleton,
} from "./SettingsPageStates";
import {
  SettingsSectionHeader,
  SettingsSettingCard,
} from "./SettingsSettingCard";
import {
  useOrgNotificationSettings,
  useUpdateOrgDefaultNotificationEventsMutation,
  useUpdateOrgEmailNotificationsEnabledMutation,
  useUpdateOrgSenderIdentityMutation,
} from "./use-org-settings-queries";

function EmailNotificationsCard({
  orgId,
  settings,
}: {
  orgId: string;
  settings: OrgNotificationSettings;
}) {
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const [enabled, setEnabled] = useState(settings.emailNotificationsEnabled);
  const update = useUpdateOrgEmailNotificationsEnabledMutation(orgId);

  useEffect(() => {
    setEnabled(settings.emailNotificationsEnabled);
  }, [settings.emailNotificationsEnabled]);

  const isDirty = enabled !== settings.emailNotificationsEnabled;
  const canSave = isDirty && !update.isPending;

  const handleSave = () => {
    if (!canSave) return;
    update.mutate(enabled, {
      onSuccess: triggerSuccessFlash,
      onError: () => toast.error("Couldn't save settings — try again"),
    });
  };

  return (
    <SettingsSettingCard
      flashKey={flashKey}
      footer={
        <SaveButton
          disabled={!canSave}
          loading={update.isPending}
          onClick={handleSave}
        />
      }
    >
      <Flex
        direction={{ base: "column", sm: "row" }}
        align={{ base: "stretch", sm: "center" }}
        justify="space-between"
        gap="4"
      >
        <Box flex="1" minW="0">
          <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="1">
            Send email notifications to members
          </Text>
          <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
            If off, members won&apos;t get emails unless they explicitly opt in.
          </Text>
        </Box>
        <Box flexShrink="0">
          <Switch.Root
            checked={enabled}
            onCheckedChange={(e) => setEnabled(e.checked)}
            colorPalette="blue"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </Box>
      </Flex>
    </SettingsSettingCard>
  );
}

const DEFAULT_EVENT_OPTIONS: {
  key: keyof OrgDefaultNotificationEvents;
  label: string;
  description: string;
}[] = [
  {
    key: "issueAssigned",
    label: "When someone is assigned an issue",
    description: "Notifies the assignee when an issue is assigned to them.",
  },
  {
    key: "mentionedInComment",
    label: "When someone is mentioned in a comment",
    description: "Notifies members when @mentioned in issue discussion.",
  },
  {
    key: "issueCreatedUpdated",
    label: "When an issue they created is updated",
    description: "Notifies the creator when their issue receives activity.",
  },
  {
    key: "watchedIssueStatusChanged",
    label: "When an issue they're watching changes status",
    description: "Notifies watchers when status moves between columns.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest of org activity",
    description:
      "A summary of project activity across the organization every Monday.",
  },
];

function DefaultEventsCard({
  orgId,
  settings,
}: {
  orgId: string;
  settings: OrgNotificationSettings;
}) {
  const [events, setEvents] = useState(settings.defaultEvents);
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const update = useUpdateOrgDefaultNotificationEventsMutation(orgId);

  useEffect(() => {
    setEvents(settings.defaultEvents);
  }, [settings.defaultEvents]);

  const isDirty =
    events.issueAssigned !== settings.defaultEvents.issueAssigned ||
    events.mentionedInComment !== settings.defaultEvents.mentionedInComment ||
    events.issueCreatedUpdated !== settings.defaultEvents.issueCreatedUpdated ||
    events.watchedIssueStatusChanged !==
      settings.defaultEvents.watchedIssueStatusChanged ||
    events.weeklyDigest !== settings.defaultEvents.weeklyDigest;

  const canSave = isDirty && !update.isPending;

  const toggle = (key: keyof OrgDefaultNotificationEvents) => {
    setEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!canSave) return;
    update.mutate(events, {
      onSuccess: triggerSuccessFlash,
      onError: () => toast.error("Couldn't save events — try again"),
    });
  };

  return (
    <SettingsSettingCard
      flashKey={flashKey}
      footer={
        <SaveButton
          disabled={!canSave}
          loading={update.isPending}
          onClick={handleSave}
        />
      }
    >
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="4">
        Default notification events
      </Text>
      <Stack gap="0">
        {DEFAULT_EVENT_OPTIONS.map((option, index) => (
          <Flex
            key={option.key}
            align="flex-start"
            gap="3"
            py="3.5"
            borderTopWidth={index === 0 ? "0" : "1px"}
            borderColor="border.divider"
          >
            <Checkbox.Root
              checked={events[option.key]}
              onCheckedChange={() => toggle(option.key)}
              mt="0.5"
              colorPalette="blue"
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
            </Checkbox.Root>
            <Box flex="1" minW="0">
              <Text
                fontSize="sm"
                fontWeight="medium"
                color="fg.primary"
                mb="0.5"
              >
                {option.label}
              </Text>
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
                {option.description}
              </Text>
            </Box>
          </Flex>
        ))}
      </Stack>
    </SettingsSettingCard>
  );
}

function SenderIdentityCard({
  orgId,
  settings,
}: {
  orgId: string;
  settings: OrgNotificationSettings;
}) {
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const [senderName, setSenderName] = useState(settings.senderName);
  const [replyToEmail, setReplyToEmail] = useState(settings.replyToEmail ?? "");
  const update = useUpdateOrgSenderIdentityMutation(orgId);

  useEffect(() => {
    setSenderName(settings.senderName);
    setReplyToEmail(settings.replyToEmail ?? "");
  }, [settings.senderName, settings.replyToEmail]);

  const normalizedReplyTo = replyToEmail.trim() || null;
  const isDirty =
    senderName.trim() !== settings.senderName ||
    normalizedReplyTo !== settings.replyToEmail;
  useSettingsUnsavedChanges("org-notifications-sender", isDirty);
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();
  useClearErrorOnChange(clearSaveError, [senderName, replyToEmail]);

  const replyToValid =
    normalizedReplyTo === null ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedReplyTo);

  const canSave =
    isDirty &&
    senderName.trim().length > 0 &&
    replyToValid &&
    !update.isPending;

  const handleSave = () => {
    if (!canSave) return;
    clearSaveError();
    update.mutate(
      { senderName: senderName.trim(), replyToEmail: normalizedReplyTo },
      {
        onSuccess: triggerSuccessFlash,
        onError: () => {
          setSaveError("Couldn't save sender identity — try again");
        },
      }
    );
  };

  return (
    <SettingsSettingCard
      flashKey={flashKey}
      footer={
        <SaveButton
          disabled={!canSave}
          loading={update.isPending}
          onClick={handleSave}
        />
      }
    >
      <Stack gap="5">
        <Field.Root invalid={!!saveError}>
          <Field.Label color="fg.primary" fontWeight="medium">
            Sender name
          </Field.Label>
          <Input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            borderRadius="control"
            maxW="md"
            placeholder="Acme Inc. on Rivet"
          />
          <Field.HelperText color="fg.muted" mt="2">
            Appears as the sender name in emails to your team.
          </Field.HelperText>
        </Field.Root>

        <Field.Root invalid={!replyToValid && replyToEmail.trim().length > 0}>
          <Field.Label color="fg.primary" fontWeight="medium">
            Reply-to email
            <Text as="span" color="fg.muted" fontWeight="normal">
              {" "}
              (optional)
            </Text>
          </Field.Label>
          <Input
            value={replyToEmail}
            onChange={(e) => setReplyToEmail(e.target.value)}
            borderRadius="control"
            maxW="md"
            type="email"
            placeholder="notifications@acme.io"
          />
          <Field.HelperText color="fg.muted" mt="2">
            Where reply-alls to notification emails are delivered.
          </Field.HelperText>
          {!replyToValid && replyToEmail.trim().length > 0 && (
            <Field.ErrorText>Enter a valid email address.</Field.ErrorText>
          )}
          {saveError && <Field.ErrorText>{saveError}</Field.ErrorText>}
        </Field.Root>
      </Stack>
    </SettingsSettingCard>
  );
}

interface OrganizationNotificationsSectionProps {
  canManage: boolean;
}

export function OrganizationNotificationsSection({
  canManage,
}: OrganizationNotificationsSectionProps) {
  const { orgId } = useActiveOrg();
  const settingsQuery = useOrgNotificationSettings(orgId);
  const settings = settingsQuery.data;

  if (!canManage) {
    return <SettingsPermissionDeniedState />;
  }

  if (settingsQuery.isLoading) {
    return <SettingsSectionSkeleton />;
  }

  if (settingsQuery.isError || !settings) {
    return <SettingsErrorState onRetry={() => void settingsQuery.refetch()} />;
  }

  return (
    <Box maxW="2xl" css={fadeIn}>
      <SettingsSectionHeader
        breadcrumb="Organization"
        title="Notifications"
        subtitle="Default notification settings for members of your organization. Individuals can override these in their own account settings."
      />

      <Stack gap="4">
        <EmailNotificationsCard orgId={orgId} settings={settings} />
        <DefaultEventsCard orgId={orgId} settings={settings} />
        <SenderIdentityCard orgId={orgId} settings={settings} />
      </Stack>
    </Box>
  );
}

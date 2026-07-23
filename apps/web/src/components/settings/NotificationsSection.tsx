import {
  Box,
  Checkbox,
  Field,
  Flex,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { useActiveOrg } from "../billing/use-active-org";
import { fadeIn } from "../issues/issues-motion";
import {
  SaveButton,
  SavingIndicator,
  useClearErrorOnChange,
  useInlineSaveError,
  useSaveSuccessFlash,
} from "./settings-card-ui";
import {
  NOTIFICATION_FREQUENCY_OPTIONS,
  type NotificationPreferences,
  type UserNotificationEvents,
} from "./settings-types";
import { useSettingsUnsavedChanges } from "./settings-unsaved-changes";
import {
  SettingsErrorState,
  SettingsSectionSkeleton,
} from "./SettingsPageStates";
import {
  SettingsSectionHeader,
  SettingsSettingCard,
} from "./SettingsSettingCard";
import {
  useAccountNotificationSettings,
  useUpdateAccountNotificationsMutation,
} from "./use-account-notification-queries";

type NotificationSaveHandler = (
  prefs: NotificationPreferences,
  onError?: (message: string) => void,
  onSuccess?: () => void
) => void;

const EVENT_OPTIONS: {
  key: keyof UserNotificationEvents;
  label: string;
}[] = [
  { key: "issueAssigned", label: "I'm assigned to an issue" },
  { key: "mentionedInComment", label: "I'm mentioned in a comment" },
  { key: "issueCreatedUpdated", label: "An issue I created is updated" },
  {
    key: "watchedIssueStatusChanged",
    label: "An issue I'm watching changes status",
  },
  { key: "roleChanged", label: "My role is changed" },
  { key: "orgInvite", label: "I'm invited to an organization" },
];

function OrgNotificationsLockedBanner() {
  return (
    <Box
      mb="4"
      px="4"
      py="3"
      borderRadius="control"
      bg="bg.surfaceHover"
      borderWidth="1px"
      borderColor="border.default"
    >
      <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
        Your organization has disabled email notifications. Contact your admin
        to enable them.
      </Text>
    </Box>
  );
}

function EmailEventsCard({
  preferences,
  disabled,
  onSave,
  isSaving,
}: {
  preferences: NotificationPreferences;
  disabled: boolean;
  onSave: NotificationSaveHandler;
  isSaving: boolean;
}) {
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const [events, setEvents] = useState(preferences.events);
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();

  useEffect(() => {
    setEvents(preferences.events);
  }, [preferences.events]);

  const isDirty = EVENT_OPTIONS.some(
    ({ key }) => events[key] !== preferences.events[key]
  );
  useSettingsUnsavedChanges("account-notifications-events", isDirty);
  useClearErrorOnChange(clearSaveError, [events]);

  const canSave = isDirty && !disabled && !isSaving;

  const toggle = (key: keyof UserNotificationEvents) => {
    if (disabled) return;
    setEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!canSave) return;
    clearSaveError();
    onSave(
      { ...preferences, events },
      () => setSaveError("Couldn't save settings — try again"),
      triggerSuccessFlash
    );
  };

  return (
    <SettingsSettingCard
      flashKey={flashKey}
      footer={
        <SaveButton
          disabled={!canSave}
          loading={isSaving}
          onClick={handleSave}
        />
      }
    >
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="4">
        Email me when
      </Text>
      <Stack gap="0">
        {EVENT_OPTIONS.map((option, index) => (
          <Flex
            key={option.key}
            align="center"
            gap="3"
            py="3"
            borderTopWidth={index === 0 ? "0" : "1px"}
            borderColor="border.default"
            opacity={disabled ? 0.55 : 1}
          >
            <Checkbox.Root
              checked={events[option.key]}
              onCheckedChange={() => toggle(option.key)}
              disabled={disabled}
              colorPalette="blue"
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
            </Checkbox.Root>
            <Text fontSize="sm" color="fg.primary">
              {option.label}
            </Text>
          </Flex>
        ))}
      </Stack>
      {saveError && (
        <Text fontSize="sm" color="status.error" mt="3">
          {saveError}
        </Text>
      )}
    </SettingsSettingCard>
  );
}

function EmailFrequencyCard({
  preferences,
  disabled,
  onSave,
  isSaving,
}: {
  preferences: NotificationPreferences;
  disabled: boolean;
  onSave: NotificationSaveHandler;
  isSaving: boolean;
}) {
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const [frequency, setFrequency] = useState(preferences.frequency);
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();

  useEffect(() => {
    setFrequency(preferences.frequency);
  }, [preferences.frequency]);

  const isDirty = frequency !== preferences.frequency;
  useSettingsUnsavedChanges("account-notifications-frequency", isDirty);
  useClearErrorOnChange(clearSaveError, [frequency]);

  const canSave = isDirty && !disabled && !isSaving;

  const handleSave = () => {
    if (!canSave) return;
    clearSaveError();
    onSave(
      { ...preferences, frequency },
      () => setSaveError("Couldn't save settings — try again"),
      triggerSuccessFlash
    );
  };

  return (
    <SettingsSettingCard
      flashKey={flashKey}
      footer={
        <SaveButton
          disabled={!canSave}
          loading={isSaving}
          onClick={handleSave}
        />
      }
    >
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="4">
        Email frequency
      </Text>
      <Stack gap="2">
        {NOTIFICATION_FREQUENCY_OPTIONS.map((option) => {
          const active = frequency === option.value;
          return (
            <Box
              key={option.value}
              as="button"
              w="full"
              textAlign="left"
              px="4"
              py="3"
              borderWidth="1px"
              borderColor={active ? "accent.default" : "border.default"}
              borderRadius="control"
              bg={active ? "brand.subtle" : "bg.surface"}
              cursor={disabled ? "not-allowed" : "pointer"}
              opacity={disabled ? 0.55 : 1}
              transition="border-color 0.15s, background 0.15s"
              _hover={
                !disabled && !active ? { bg: "bg.surfaceHover" } : undefined
              }
              onClick={() => !disabled && setFrequency(option.value)}
            >
              <Text
                fontSize="sm"
                fontWeight={active ? "semibold" : "medium"}
                color={active ? "accent.default" : "fg.primary"}
              >
                {option.label}
              </Text>
              <Text fontSize="xs" color="fg.muted" mt="0.5">
                {option.description}
              </Text>
            </Box>
          );
        })}
      </Stack>
      {saveError && (
        <Text fontSize="sm" color="status.error" mt="3">
          {saveError}
        </Text>
      )}
    </SettingsSettingCard>
  );
}

function NotificationEmailCard({
  preferences,
  loginEmail,
  disabled,
  onSave,
  isSaving,
}: {
  preferences: NotificationPreferences;
  loginEmail: string;
  disabled: boolean;
  onSave: NotificationSaveHandler;
  isSaving: boolean;
}) {
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const [email, setEmail] = useState(preferences.notificationEmail ?? "");
  const [useLoginEmail, setUseLoginEmail] = useState(
    preferences.notificationEmail === null
  );
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();

  useEffect(() => {
    setEmail(preferences.notificationEmail ?? "");
    setUseLoginEmail(preferences.notificationEmail === null);
  }, [preferences.notificationEmail]);

  const normalizedEmail = email.trim() || null;
  const targetEmail = useLoginEmail ? null : normalizedEmail;
  const isDirty = targetEmail !== preferences.notificationEmail;
  useSettingsUnsavedChanges("account-notifications-email", isDirty);
  useClearErrorOnChange(clearSaveError, [email, useLoginEmail]);

  const emailValid =
    useLoginEmail ||
    normalizedEmail === null ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const canSave = isDirty && emailValid && !disabled && !isSaving;

  const handleSave = () => {
    if (!canSave) return;
    clearSaveError();
    onSave(
      { ...preferences, notificationEmail: targetEmail },
      () => setSaveError("Couldn't save settings — try again"),
      triggerSuccessFlash
    );
  };

  return (
    <SettingsSettingCard
      flashKey={flashKey}
      footer={
        <SaveButton
          disabled={!canSave}
          loading={isSaving}
          onClick={handleSave}
        />
      }
    >
      <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="4">
        Notification email address
      </Text>

      <Stack gap="4">
        <Flex align="center" gap="3" py="2" opacity={disabled ? 0.55 : 1}>
          <Checkbox.Root
            checked={useLoginEmail}
            onCheckedChange={(e) => {
              if (disabled) return;
              const checked = e.checked === true;
              setUseLoginEmail(checked);
              if (checked) setEmail("");
            }}
            disabled={disabled}
            colorPalette="blue"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
          </Checkbox.Root>
          <Text fontSize="sm" color="fg.primary">
            Use login email ({loginEmail})
          </Text>
        </Flex>

        {!useLoginEmail && (
          <Field.Root invalid={!emailValid && email.trim().length > 0}>
            <Field.Label color="fg.primary" fontWeight="medium">
              Alternate email
            </Field.Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              borderRadius="control"
              maxW="md"
              type="email"
              placeholder="you@work.com"
              disabled={disabled}
            />
            {!emailValid && email.trim().length > 0 && (
              <Field.ErrorText>Enter a valid email address.</Field.ErrorText>
            )}
          </Field.Root>
        )}

        <Text fontSize="sm" color="fg.muted" mt="-2" lineHeight="1.5">
          {useLoginEmail
            ? "Notification emails will be sent to your login address."
            : "Send notification emails to a different address than the one you sign in with."}
        </Text>
        {saveError && (
          <Text fontSize="sm" color="status.error" mt="2">
            {saveError}
          </Text>
        )}
      </Stack>
    </SettingsSettingCard>
  );
}

export function NotificationsSection({
  skipLoadingState,
}: { skipLoadingState?: boolean } = {}) {
  const { orgId } = useActiveOrg();
  const settingsQuery = useAccountNotificationSettings(orgId);
  const updateNotifications = useUpdateAccountNotificationsMutation(orgId);

  const data = settingsQuery.data;
  const orgLocked = data ? !data.orgEmailNotificationsEnabled : false;

  const handleSave: NotificationSaveHandler = (prefs, onError, onSuccess) => {
    updateNotifications.mutate(prefs, {
      onSuccess: () => onSuccess?.(),
      onError: () => {
        onError?.("Couldn't save settings — try again");
      },
    });
  };

  if (settingsQuery.isLoading) {
    return skipLoadingState ? null : <SettingsSectionSkeleton />;
  }

  if (settingsQuery.isError || !data) {
    return <SettingsErrorState onRetry={() => void settingsQuery.refetch()} />;
  }

  return (
    <Box maxW="2xl" css={fadeIn}>
      <Box position="relative">
        <SettingsSectionHeader
          breadcrumb="Settings › Account"
          title="Notifications"
          subtitle="Choose what you want to be emailed about"
        />
        <Box position="absolute" top="0" right="0">
          <SavingIndicator visible={updateNotifications.isPending} />
        </Box>
      </Box>

      {orgLocked && <OrgNotificationsLockedBanner />}

      <Stack gap="4">
        <EmailEventsCard
          preferences={data.preferences}
          disabled={orgLocked}
          isSaving={updateNotifications.isPending}
          onSave={handleSave}
        />
        <EmailFrequencyCard
          preferences={data.preferences}
          disabled={orgLocked}
          isSaving={updateNotifications.isPending}
          onSave={handleSave}
        />
        <NotificationEmailCard
          preferences={data.preferences}
          loginEmail={data.loginEmail}
          disabled={orgLocked}
          isSaving={updateNotifications.isPending}
          onSave={handleSave}
        />
      </Stack>
    </Box>
  );
}

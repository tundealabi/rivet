import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { PiCheck } from "react-icons/pi";

import { EASE_OUT, fadeIn } from "../issues/issues-motion";
import {
  SaveButton,
  useClearErrorOnChange,
  useInlineSaveError,
  useSaveSuccessFlash,
} from "./settings-card-ui";
import {
  DATE_FORMAT_OPTIONS,
  type DateFormatStyle,
  LANGUAGE_OPTIONS,
  type UserProfile,
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
  useChangePasswordMutation,
  useRemoveAvatarMutation,
  useRequestEmailChangeMutation,
  useUpdateFullNameMutation,
  useUpdateUserLocaleMutation,
  useUploadAvatarMutation,
  useUserProfile,
} from "./use-profile-settings-queries";

const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];

function profileInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getIanaTimeZones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone").slice().sort();
  } catch {
    return [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Asia/Tokyo",
      "UTC",
    ];
  }
}

const IANA_TIME_ZONES = getIanaTimeZones();

function passwordStrengthLevel(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 1;
  if (score <= 2) return 2;
  return 3;
}

function strengthBarColor(level: 0 | 1 | 2 | 3): string {
  if (level <= 1) return "border.default";
  if (level === 2) return "status.warning";
  return "status.success";
}

function ProfileNameCard({ profile }: { profile: UserProfile }) {
  const [fullName, setFullName] = useState(profile.fullName);
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const updateName = useUpdateFullNameMutation();
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();

  useEffect(() => {
    setFullName(profile.fullName);
  }, [profile.fullName]);

  const isDirty = fullName.trim() !== profile.fullName;
  useSettingsUnsavedChanges("profile-name", isDirty);
  useClearErrorOnChange(clearSaveError, [fullName]);

  const canSave =
    isDirty && fullName.trim().length > 0 && !updateName.isPending;

  const handleSave = () => {
    if (!canSave) return;
    clearSaveError();
    updateName.mutate(fullName.trim(), {
      onSuccess: triggerSuccessFlash,
      onError: () => {
        setSaveError("Couldn't save name — try again");
      },
    });
  };

  return (
    <SettingsSettingCard
      flashKey={flashKey}
      footer={
        <SaveButton
          disabled={!canSave}
          loading={updateName.isPending}
          onClick={handleSave}
        />
      }
    >
      <Field.Root invalid={!!saveError}>
        <Field.Label color="fg.primary" fontWeight="medium">
          Full name
        </Field.Label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          borderRadius="control"
          maxW="md"
        />
        <Field.HelperText color="fg.muted" mt="2">
          This is how your name appears to teammates.
        </Field.HelperText>
        {saveError && <Field.ErrorText mt="2">{saveError}</Field.ErrorText>}
      </Field.Root>
    </SettingsSettingCard>
  );
}

function ProfileAvatarCard({ profile }: { profile: UserProfile }) {
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const uploadAvatar = useUploadAvatarMutation();
  const removeAvatar = useRemoveAvatarMutation();

  const uploading = uploadAvatar.isPending;
  const initials = profileInitials(profile.fullName);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Photo must be PNG or JPG");
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      toast.error("Photo must be under 2MB");
      return;
    }

    setUploadProgress(0);
    uploadAvatar.mutate(
      { file, onProgress: setUploadProgress },
      {
        onSuccess: () => {
          setUploadProgress(null);
          triggerSuccessFlash();
        },
        onError: () => {
          setUploadProgress(null);
          toast.error("Couldn't upload photo — try again");
        },
      }
    );
  };

  const handleRemove = () => {
    removeAvatar.mutate(undefined, {
      onSuccess: triggerSuccessFlash,
      onError: () => toast.error("Couldn't remove photo — try again"),
    });
  };

  return (
    <SettingsSettingCard flashKey={flashKey}>
      <Field.Root>
        <Field.Label color="fg.primary" fontWeight="medium">
          Avatar
        </Field.Label>

        <Flex align="center" gap="4" mb="4">
          <Flex
            boxSize="20"
            align="center"
            justify="center"
            borderRadius="full"
            borderWidth="1px"
            borderColor="border.default"
            bg="brand.subtle"
            overflow="hidden"
            flexShrink="0"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.fullName} avatar`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Text fontSize="xl" fontWeight="bold" color="accent.default">
                {initials}
              </Text>
            )}
          </Flex>
        </Flex>

        <HStack gap="3" mb="2">
          <Button
            variant="ghost"
            size="sm"
            borderRadius="control"
            fontWeight="medium"
            disabled={uploading || removeAvatar.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload photo
          </Button>
          {profile.avatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              borderRadius="control"
              fontWeight="medium"
              color="fg.muted"
              _hover={{ color: "status.error" }}
              disabled={uploading || removeAvatar.isPending}
              onClick={handleRemove}
            >
              Remove
            </Button>
          )}
        </HStack>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          hidden
          onChange={handleFileChange}
        />

        {uploadProgress !== null && (
          <Box mb="3" maxW="xs">
            <Box
              h="1.5"
              borderRadius="full"
              bg="billing.progress.track"
              overflow="hidden"
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <Box
                h="full"
                w={`${uploadProgress}%`}
                borderRadius="full"
                bg="accent.default"
                transition="width 0.25s ease"
              />
            </Box>
          </Box>
        )}

        <Field.HelperText color="fg.muted">
          Square image, at least 200×200px, under 2MB. PNG or JPG.
        </Field.HelperText>
      </Field.Root>
    </SettingsSettingCard>
  );
}

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newEmail: string;
  currentEmail: string;
  onConfirm: () => void;
  loading?: boolean;
}

function ChangeEmailDialog({
  open,
  onOpenChange,
  newEmail,
  currentEmail,
  onConfirm,
  loading,
}: ChangeEmailDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.surface"
          borderRadius="card"
          maxW="md"
          w="full"
          mx="4"
          animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
        >
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">Confirm email change</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Stack gap="3">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                We&apos;ll send a verification link to{" "}
                <Text as="span" fontWeight="semibold" color="fg.primary">
                  {newEmail}
                </Text>
                . Your current address{" "}
                <Text as="span" fontWeight="medium" color="fg.primary">
                  {currentEmail}
                </Text>{" "}
                will receive a security notification.
              </Text>
              <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
                You&apos;ll need to verify the new address before it becomes
                active for login.
              </Text>
            </Stack>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              variant="outline"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="accent.default"
              color="white"
              fontWeight="semibold"
              _hover={{ bg: "accent.hover" }}
              loading={loading}
              onClick={onConfirm}
            >
              Send verification
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function ProfileEmailCard({ profile }: { profile: UserProfile }) {
  const [email, setEmail] = useState(profile.email);
  const [dialogOpen, setDialogOpen] = useState(false);
  const requestEmailChange = useRequestEmailChangeMutation();
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();

  useEffect(() => {
    setEmail(profile.email);
  }, [profile.email]);

  const isDirty = email.trim().toLowerCase() !== profile.email.toLowerCase();
  useSettingsUnsavedChanges("profile-email", isDirty);
  useClearErrorOnChange(clearSaveError, [email]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSave = isDirty && emailValid && !requestEmailChange.isPending;

  const handleSaveClick = () => {
    if (!canSave) return;
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    requestEmailChange.mutate(email.trim(), {
      onSuccess: ({ previousEmail }) => {
        setDialogOpen(false);
        clearSaveError();
        toast.success(`Verification link sent to ${email.trim()}.`);
        toast(`Security notification sent to ${previousEmail}.`, {
          icon: "🔒",
        });
      },
      onError: () => {
        setSaveError("Couldn't update email — try again");
        toast.error("Couldn't update email — try again");
      },
    });
  };

  return (
    <>
      <SettingsSettingCard
        footer={
          <SaveButton
            disabled={!canSave}
            loading={requestEmailChange.isPending}
            onClick={handleSaveClick}
          />
        }
      >
        <Field.Root invalid={!!saveError}>
          <Field.Label color="fg.primary" fontWeight="medium">
            Email address
          </Field.Label>
          <Flex align="center" gap="3" maxW="md">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              borderRadius="control"
              type="email"
              flex="1"
            />
            {profile.emailVerified && !isDirty && (
              <HStack gap="1" flexShrink="0" color="status.success">
                <PiCheck size={16} />
                <Text fontSize="sm" fontWeight="medium">
                  Verified
                </Text>
              </HStack>
            )}
          </Flex>
          {!profile.emailVerified && !isDirty && (
            <Text fontSize="sm" color="status.warning" mt="2">
              Email not verified — check your inbox for a verification link.
            </Text>
          )}
          <Field.HelperText color="fg.muted" mt="2">
            You&apos;ll receive login and notification emails here.
          </Field.HelperText>
          {saveError && <Field.ErrorText mt="2">{saveError}</Field.ErrorText>}
        </Field.Root>
      </SettingsSettingCard>

      <ChangeEmailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        newEmail={email.trim()}
        currentEmail={profile.email}
        onConfirm={handleConfirm}
        loading={requestEmailChange.isPending}
      />
    </>
  );
}

function ProfilePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const changePassword = useChangePasswordMutation();
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();

  const strength = passwordStrengthLevel(newPassword);

  const isValid = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (newPassword.length < 8) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [currentPassword, newPassword, confirmPassword]);

  const isDirty = Boolean(currentPassword || newPassword || confirmPassword);
  useSettingsUnsavedChanges("profile-password", isDirty);
  useClearErrorOnChange(clearSaveError, [
    currentPassword,
    newPassword,
    confirmPassword,
  ]);

  const handleSave = () => {
    if (!isValid) return;
    clearSaveError();
    changePassword.mutate(
      { current: currentPassword, next: newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          triggerSuccessFlash();
        },
        onError: () => {
          setSaveError(
            "Couldn't update password — check your current password"
          );
        },
      }
    );
  };

  return (
    <SettingsSettingCard
      flashKey={flashKey}
      footer={
        <SaveButton
          label="Update password"
          disabled={!isValid}
          loading={changePassword.isPending}
          onClick={handleSave}
        />
      }
    >
      <Stack gap="4">
        <Field.Root invalid={!!saveError}>
          <Field.Label color="fg.primary" fontWeight="medium">
            Current password
          </Field.Label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            borderRadius="control"
            maxW="md"
            autoComplete="current-password"
          />
          {saveError && <Field.ErrorText mt="2">{saveError}</Field.ErrorText>}
        </Field.Root>

        <Field.Root>
          <Field.Label color="fg.primary" fontWeight="medium">
            New password
          </Field.Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            borderRadius="control"
            maxW="md"
            autoComplete="new-password"
          />
          {newPassword && (
            <Box mt="2" maxW="md">
              <Flex gap="1">
                {[1, 2, 3].map((segment) => (
                  <Box
                    key={segment}
                    flex="1"
                    h="1"
                    borderRadius="full"
                    bg={
                      strength >= segment
                        ? strengthBarColor(strength)
                        : "border.default"
                    }
                    transition="background 0.2s ease"
                  />
                ))}
              </Flex>
            </Box>
          )}
        </Field.Root>

        <Field.Root>
          <Field.Label color="fg.primary" fontWeight="medium">
            Confirm new password
          </Field.Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            borderRadius="control"
            maxW="md"
            autoComplete="new-password"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <Text fontSize="sm" color="status.error" mt="2">
              Passwords don&apos;t match.
            </Text>
          )}
        </Field.Root>
      </Stack>
    </SettingsSettingCard>
  );
}

function ProfileLocaleCard({ profile }: { profile: UserProfile }) {
  const [language, setLanguage] = useState(profile.locale.language);
  const [timezone, setTimezone] = useState(profile.locale.timezone);
  const [dateFormat, setDateFormat] = useState<DateFormatStyle>(
    profile.locale.dateFormat
  );
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const updateLocale = useUpdateUserLocaleMutation();

  useEffect(() => {
    setLanguage(profile.locale.language);
    setTimezone(profile.locale.timezone);
    setDateFormat(profile.locale.dateFormat);
  }, [profile.locale]);

  const isDirty =
    language !== profile.locale.language ||
    timezone !== profile.locale.timezone ||
    dateFormat !== profile.locale.dateFormat;
  useSettingsUnsavedChanges("profile-locale", isDirty);
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();
  useClearErrorOnChange(clearSaveError, [language, timezone, dateFormat]);

  const canSave = isDirty && !updateLocale.isPending;

  const handleSave = () => {
    if (!canSave) return;
    clearSaveError();
    updateLocale.mutate(
      { language, timezone, dateFormat },
      {
        onSuccess: triggerSuccessFlash,
        onError: () => {
          setSaveError("Couldn't save settings — try again");
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
          loading={updateLocale.isPending}
          onClick={handleSave}
        />
      }
    >
      <Stack gap="5">
        <Field.Root>
          <Field.Label color="fg.primary" fontWeight="medium">
            Language
          </Field.Label>
          <NativeSelect.Root maxW="md">
            <NativeSelect.Field
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              borderRadius="control"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label color="fg.primary" fontWeight="medium">
            Time zone
          </Field.Label>
          <NativeSelect.Root maxW="md">
            <NativeSelect.Field
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              borderRadius="control"
            >
              {IANA_TIME_ZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label color="fg.primary" fontWeight="medium">
            Date format
          </Field.Label>
          <Flex
            gap="0"
            maxW="md"
            borderWidth="1px"
            borderColor="border.default"
            borderRadius="control"
            overflow="hidden"
            flexWrap="wrap"
          >
            {DATE_FORMAT_OPTIONS.map((option, index) => {
              const active = dateFormat === option.value;
              return (
                <Box
                  key={option.value}
                  as="button"
                  flex="1"
                  minW="fit-content"
                  px="3"
                  py="2.5"
                  fontSize="sm"
                  fontWeight={active ? "semibold" : "medium"}
                  color={active ? "accent.default" : "fg.secondary"}
                  bg={active ? "brand.subtle" : "bg.surface"}
                  borderRightWidth={
                    index < DATE_FORMAT_OPTIONS.length - 1 ? "1px" : undefined
                  }
                  borderColor="border.default"
                  cursor="pointer"
                  transition="background 0.15s, color 0.15s"
                  _hover={!active ? { bg: "bg.surfaceHover" } : undefined}
                  onClick={() => setDateFormat(option.value)}
                >
                  {option.label}
                </Box>
              );
            })}
          </Flex>
        </Field.Root>

        <Text fontSize="sm" color="fg.muted" mt="-2" lineHeight="1.5">
          Applies to how dates and times appear for you across Rivet.
        </Text>
        {saveError && (
          <Text fontSize="sm" color="status.error">
            {saveError}
          </Text>
        )}
      </Stack>
    </SettingsSettingCard>
  );
}

export function ProfileSection({
  skipLoadingState,
}: { skipLoadingState?: boolean } = {}) {
  const profileQuery = useUserProfile();
  const profile = profileQuery.data;

  if (profileQuery.isLoading) {
    return skipLoadingState ? null : <SettingsSectionSkeleton />;
  }

  if (profileQuery.isError || !profile) {
    return <SettingsErrorState onRetry={() => void profileQuery.refetch()} />;
  }

  return (
    <Box maxW="2xl" css={fadeIn}>
      <SettingsSectionHeader
        breadcrumb="Account"
        title="Profile"
        subtitle="Your personal identity in Rivet. This stays the same across every organization you belong to."
      />

      <Stack gap="4">
        <ProfileAvatarCard profile={profile} />
        <ProfileNameCard profile={profile} />
        <ProfileEmailCard profile={profile} />
        <ProfilePasswordCard />
        <ProfileLocaleCard profile={profile} />
      </Stack>
    </Box>
  );
}

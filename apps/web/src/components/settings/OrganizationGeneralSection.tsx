import {
  Box,
  Button,
  Field,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { PiCheck, PiX } from "react-icons/pi";

import { useActiveOrg } from "../billing/use-active-org";
import { fadeIn } from "../issues/issues-motion";
import { normalizeOrgSlug } from "./settings-api";
import {
  SaveButton,
  useClearErrorOnChange,
  useInlineSaveError,
  useSaveSuccessFlash,
} from "./settings-card-ui";
import {
  DATE_FORMAT_OPTIONS,
  type DateFormatStyle,
  type OrgGeneralSettings,
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
  useOrgGeneralSettings,
  useRemoveOrgLogoMutation,
  useSlugAvailabilityQuery,
  useUpdateOrgLocaleMutation,
  useUpdateOrgNameMutation,
  useUpdateOrgSlugMutation,
  useUploadOrgLogoMutation,
} from "./use-org-settings-queries";

const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg"];

function orgInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
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

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function OrganizationNameCard({
  orgId,
  settings,
}: {
  orgId: string;
  settings: OrgGeneralSettings;
}) {
  const [name, setName] = useState(settings.name);
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const updateName = useUpdateOrgNameMutation(orgId);
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();

  useEffect(() => {
    setName(settings.name);
  }, [settings.name]);

  const isDirty = name.trim() !== settings.name;
  useSettingsUnsavedChanges("org-name", isDirty);
  useClearErrorOnChange(clearSaveError, [name]);

  const canSave = isDirty && name.trim().length > 0 && !updateName.isPending;

  const handleSave = () => {
    if (!canSave) return;
    clearSaveError();
    updateName.mutate(name.trim(), {
      onSuccess: triggerSuccessFlash,
      onError: () => {
        setSaveError("Couldn't save organization name — try again");
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
          Organization name
        </Field.Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          borderRadius="control"
          maxW="md"
        />
        <Field.HelperText color="fg.muted" mt="2">
          This appears in the sidebar and in emails sent to your team.
        </Field.HelperText>
        {saveError && <Field.ErrorText mt="2">{saveError}</Field.ErrorText>}
      </Field.Root>
    </SettingsSettingCard>
  );
}

function OrganizationSlugCard({
  orgId,
  settings,
}: {
  orgId: string;
  settings: OrgGeneralSettings;
}) {
  const [slug, setSlug] = useState(settings.slug);
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const updateSlug = useUpdateOrgSlugMutation(orgId);
  const debouncedSlug = useDebouncedValue(normalizeOrgSlug(slug), 400);
  const slugChanged = debouncedSlug !== settings.slug;
  const shouldCheck = slugChanged && debouncedSlug.length >= 2;

  const availabilityQuery = useSlugAvailabilityQuery(
    orgId,
    debouncedSlug,
    settings.slug,
    shouldCheck
  );

  useEffect(() => {
    setSlug(settings.slug);
  }, [settings.slug]);

  const isDirty = normalizeOrgSlug(slug) !== settings.slug;
  useSettingsUnsavedChanges("org-slug", isDirty);
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();
  useClearErrorOnChange(clearSaveError, [slug]);

  const availability = shouldCheck
    ? availabilityQuery.isFetching
      ? "checking"
      : (availabilityQuery.data ?? "invalid")
    : "unchanged";

  const slugValid =
    !shouldCheck ||
    availability === "available" ||
    availability === "unchanged";

  const canSave =
    isDirty &&
    slugValid &&
    normalizeOrgSlug(slug).length >= 2 &&
    !updateSlug.isPending &&
    !availabilityQuery.isFetching;

  const handleSave = () => {
    const normalized = normalizeOrgSlug(slug);
    if (!canSave) return;
    clearSaveError();
    updateSlug.mutate(normalized, {
      onSuccess: triggerSuccessFlash,
      onError: () => {
        setSaveError("Couldn't save slug — try again");
      },
    });
  };

  return (
    <SettingsSettingCard
      flashKey={flashKey}
      footer={
        <SaveButton
          disabled={!canSave}
          loading={updateSlug.isPending}
          onClick={handleSave}
        />
      }
    >
      <Field.Root invalid={!!saveError}>
        <Field.Label color="fg.primary" fontWeight="medium">
          Organization slug
        </Field.Label>
        <Flex
          maxW="md"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="control"
          overflow="hidden"
          bg="bg.surface"
        >
          <Flex
            align="center"
            px="3"
            bg="bg.surfaceHover"
            borderRightWidth="1px"
            borderColor="border.default"
            flexShrink="0"
          >
            <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">
              rivet.app/
            </Text>
          </Flex>
          <Input
            value={slug}
            onChange={(e) => setSlug(normalizeOrgSlug(e.target.value))}
            border="none"
            borderRadius="0"
            fontFamily="mono"
            fontSize="sm"
            flex="1"
            _focusVisible={{ boxShadow: "none", outline: "none" }}
          />
          {shouldCheck && (
            <Flex align="center" px="3" flexShrink="0">
              {availabilityQuery.isFetching ? (
                <Box
                  boxSize="4"
                  borderWidth="2px"
                  borderColor="border.default"
                  borderTopColor="accent.default"
                  borderRadius="full"
                  animation="spin 0.7s linear infinite"
                />
              ) : availability === "available" ? (
                <Box color="status.success" lineHeight="0">
                  <PiCheck size={18} />
                </Box>
              ) : (
                <Box color="status.error" lineHeight="0">
                  <PiX size={18} />
                </Box>
              )}
            </Flex>
          )}
        </Flex>
        <Text fontSize="sm" color="billing.warning.fg" mt="2" lineHeight="1.5">
          Used in URLs. Changing this may break existing links.
        </Text>
        {shouldCheck && availability === "taken" && (
          <Text fontSize="sm" color="status.error" mt="1">
            This slug is already taken.
          </Text>
        )}
        {shouldCheck &&
          availability === "invalid" &&
          !availabilityQuery.isFetching && (
            <Text fontSize="sm" color="status.error" mt="1">
              Use lowercase letters, numbers, and hyphens only.
            </Text>
          )}
        {saveError && <Field.ErrorText mt="1">{saveError}</Field.ErrorText>}
      </Field.Root>
    </SettingsSettingCard>
  );
}

function OrganizationLogoCard({
  orgId,
  settings,
}: {
  orgId: string;
  settings: OrgGeneralSettings;
}) {
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const uploadLogo = useUploadOrgLogoMutation(orgId);
  const removeLogo = useRemoveOrgLogoMutation(orgId);

  const uploading = uploadLogo.isPending;
  const initials = orgInitials(settings.name);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error("Logo must be PNG or JPG");
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setUploadProgress(0);
    uploadLogo.mutate(
      {
        file,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: () => {
          setUploadProgress(null);
          triggerSuccessFlash();
        },
        onError: () => {
          setUploadProgress(null);
          toast.error("Couldn't upload logo — try again");
        },
      }
    );
  };

  const handleRemove = () => {
    removeLogo.mutate(undefined, {
      onSuccess: triggerSuccessFlash,
      onError: () => toast.error("Couldn't remove logo — try again"),
    });
  };

  return (
    <SettingsSettingCard flashKey={flashKey}>
      <Field.Root>
        <Field.Label color="fg.primary" fontWeight="medium">
          Logo
        </Field.Label>

        <Flex align="center" gap="4" mb="4">
          <Flex
            boxSize="20"
            align="center"
            justify="center"
            borderRadius="control"
            borderWidth="1px"
            borderColor="border.default"
            bg="bg.surfaceHover"
            overflow="hidden"
            flexShrink="0"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={`${settings.name} logo`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Text fontSize="lg" fontWeight="bold" color="accent.default">
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
            disabled={uploading || removeLogo.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload image
          </Button>
          {settings.logoUrl && (
            <Box
              as="button"
              fontSize="sm"
              color="fg.muted"
              fontWeight="medium"
              bg="transparent"
              border="none"
              p="0"
              cursor={
                uploading || removeLogo.isPending ? "not-allowed" : "pointer"
              }
              opacity={uploading || removeLogo.isPending ? 0.5 : 1}
              _hover={{ color: "status.error", textDecoration: "underline" }}
              onClick={handleRemove}
            >
              Remove
            </Box>
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

function OrganizationLocaleCard({
  orgId,
  settings,
}: {
  orgId: string;
  settings: OrgGeneralSettings;
}) {
  const [timezone, setTimezone] = useState(settings.timezone);
  const [dateFormat, setDateFormat] = useState<DateFormatStyle>(
    settings.dateFormat
  );
  const { flashKey, triggerSuccessFlash } = useSaveSuccessFlash();
  const updateLocale = useUpdateOrgLocaleMutation(orgId);

  useEffect(() => {
    setTimezone(settings.timezone);
    setDateFormat(settings.dateFormat);
  }, [settings.timezone, settings.dateFormat]);

  const isDirty =
    timezone !== settings.timezone || dateFormat !== settings.dateFormat;
  useSettingsUnsavedChanges("org-locale", isDirty);
  const { saveError, setSaveError, clearSaveError } = useInlineSaveError();
  useClearErrorOnChange(clearSaveError, [timezone, dateFormat]);

  const canSave = isDirty && !updateLocale.isPending;

  const handleSave = () => {
    if (!canSave) return;
    clearSaveError();
    updateLocale.mutate(
      { timezone, dateFormat },
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
        <Field.Root invalid={!!saveError}>
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
          Applies to all members of your organization.
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

interface OrganizationGeneralSectionProps {
  canManage: boolean;
}

export function OrganizationGeneralSection({
  canManage,
}: OrganizationGeneralSectionProps) {
  const { orgId } = useActiveOrg();
  const settingsQuery = useOrgGeneralSettings(orgId);

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
        title="General"
        subtitle="How your organization appears to your team. These settings apply to everyone in your org."
      />

      <Stack gap="4">
        <OrganizationNameCard orgId={orgId} settings={settings} />
        <OrganizationSlugCard orgId={orgId} settings={settings} />
        <OrganizationLogoCard orgId={orgId} settings={settings} />
        <OrganizationLocaleCard orgId={orgId} settings={settings} />
      </Stack>
    </Box>
  );
}

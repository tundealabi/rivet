import {
  Box,
  Button,
  Dialog,
  Field,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { logoutUser } from "../../auth-api";
import { useActiveOrg } from "../billing/use-active-org";
import { EASE_OUT, fadeIn } from "../issues/issues-motion";
import { DangerZoneCard } from "./danger-zone-ui";
import { MOCK_USER_PROFILE } from "./mock-profile-data";
import { destructiveButtonProps } from "./settings-card-ui";
import {
  SettingsErrorState,
  SettingsSectionSkeleton,
} from "./SettingsPageStates";
import { SettingsSectionHeader } from "./SettingsSettingCard";
import { useUserProfile } from "./use-profile-settings-queries";
import {
  useAccountDangerContext,
  useDeleteAccountMutation,
  useLeaveOrganizationMutation,
} from "./use-settings-queries";

interface LeaveOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  onConfirm: () => void;
  loading?: boolean;
}

function LeaveOrganizationDialog({
  open,
  onOpenChange,
  orgName,
  onConfirm,
  loading,
}: LeaveOrganizationDialogProps) {
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (!open) setConfirmName("");
  }, [open]);

  const matches = confirmName.trim() === orgName;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
      role="alertdialog"
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
            <Dialog.Title color="fg.primary">Leave {orgName}?</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Stack gap="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                You will lose access to all projects and issues in this
                organization. This can be reversed by an admin sending a new
                invite.
              </Text>
              <Field.Root>
                <Field.Label color="fg.primary">
                  Type{" "}
                  <Text as="span" fontFamily="mono">
                    {orgName}
                  </Text>{" "}
                  to confirm
                </Field.Label>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  borderRadius="control"
                  autoFocus
                />
              </Field.Root>
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
              {...destructiveButtonProps.solid}
              disabled={!matches}
              loading={loading}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Leave organization
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface DeleteAccountDialogProps {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  email: string;

  onConfirm: () => void;

  loading?: boolean;
}

function DeleteAccountDialog({
  open,

  onOpenChange,

  email,

  onConfirm,

  loading,
}: DeleteAccountDialogProps) {
  const [confirmEmail, setConfirmEmail] = useState("");

  useEffect(() => {
    if (!open) setConfirmEmail("");
  }, [open]);

  const matches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

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
            <Dialog.Title color="fg.primary">Delete account</Dialog.Title>
          </Dialog.Header>

          <Dialog.Body px="6" py="5">
            <Stack gap="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                This permanently deletes your Rivet account and removes you from
                all organizations. Your issues and comments will remain but show
                as a deleted user.
              </Text>

              <Field.Root>
                <Field.Label color="fg.primary">
                  Type{" "}
                  <Text as="span" fontFamily="mono">
                    {email}
                  </Text>{" "}
                  to confirm
                </Field.Label>

                <Input
                  value={confirmEmail}

                  onChange={(e) => setConfirmEmail(e.target.value)}

                  borderRadius="control"

                  autoFocus
                />
              </Field.Root>
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
              {...destructiveButtonProps.solid}
              disabled={!matches}
              loading={loading}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Delete account
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface DangerZoneSectionProps {
  skipLoadingState?: boolean;
}

export function DangerZoneSection({
  skipLoadingState,
}: DangerZoneSectionProps) {
  const navigate = useNavigate();

  const { orgId, orgName } = useActiveOrg();

  const profileQuery = useUserProfile();

  const dangerQuery = useAccountDangerContext(orgId);

  const leaveOrganization = useLeaveOrganizationMutation(orgId);

  const deleteAccount = useDeleteAccountMutation();

  const [leaveOpen, setLeaveOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const email = profileQuery.data?.email ?? MOCK_USER_PROFILE.email;

  const memberships = dangerQuery.data?.memberships ?? [];

  const currentMembership = useMemo(
    () => memberships.find((membership) => membership.orgId === orgId),

    [memberships, orgId]
  );

  const isOwnerOfCurrentOrg =
    currentMembership?.role === OrganizationRole.OWNER;

  const ownedOrgs = useMemo(
    () =>
      memberships.filter(
        (membership) => membership.role === OrganizationRole.OWNER
      ),

    [memberships]
  );

  const ownsAnyOrg = ownedOrgs.length > 0;

  const leaveDescription = isOwnerOfCurrentOrg
    ? "You must transfer ownership before you can leave this organization."
    : "You will lose access to all projects and issues in this organization. This can be reversed by an admin sending a new invite.";

  const deleteDescription = ownsAnyOrg
    ? `You own: ${ownedOrgs.map((org) => org.orgName).join(", ")}. Transfer or delete these before deleting your account.`
    : "Permanently delete your Rivet account. This will remove you from all organizations you belong to. If you own organizations, transfer ownership first.";

  if (profileQuery.isLoading || dangerQuery.isLoading) {
    return skipLoadingState ? null : <SettingsSectionSkeleton />;
  }

  if (profileQuery.isError || dangerQuery.isError) {
    return (
      <SettingsErrorState
        onRetry={() => {
          void profileQuery.refetch();

          void dangerQuery.refetch();
        }}
      />
    );
  }

  const handleLeaveOrganization = () => {
    leaveOrganization.mutate(undefined, {
      onSuccess: () => {
        toast.success(`You left ${orgName}`);

        void navigate("/projects");
      },

      onError: () => toast.error("Couldn't leave organization — try again"),
    });
  };

  const handleDeleteAccount = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        void logoutUser().then(() => {
          toast.success("Account deleted");
          void navigate("/login");
        });
      },

      onError: () => toast.error("Couldn't delete account — try again"),
    });
  };

  return (
    <Box maxW="2xl" css={fadeIn}>
      <SettingsSectionHeader
        breadcrumb="Settings › Account"

        title="Danger zone"

        subtitle="Leave organizations or permanently delete your Rivet account."
      />

      <Stack gap="4">
        <DangerZoneCard
          label={`Leave ${orgName}`}

          description={leaveDescription}

          action={
            <Button
              {...destructiveButtonProps.ghost}
              flexShrink="0"
              disabled={isOwnerOfCurrentOrg}
              onClick={() => setLeaveOpen(true)}
            >
              Leave organization
            </Button>
          }
        />

        <DangerZoneCard
          label="Delete your account"

          description={deleteDescription}

          action={
            <Button
              {...destructiveButtonProps.solid}
              flexShrink="0"
              disabled={ownsAnyOrg}
              loading={deleteAccount.isPending}
              onClick={() => setDeleteOpen(true)}
            >
              Delete account
            </Button>
          }
        />
      </Stack>

      <LeaveOrganizationDialog
        open={leaveOpen}

        onOpenChange={setLeaveOpen}

        orgName={orgName}

        loading={leaveOrganization.isPending}

        onConfirm={handleLeaveOrganization}
      />

      <DeleteAccountDialog
        open={deleteOpen}

        onOpenChange={setDeleteOpen}

        email={email}

        loading={deleteAccount.isPending}

        onConfirm={handleDeleteAccount}
      />
    </Box>
  );
}

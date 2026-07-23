import { Button, Dialog, Field, Input, Stack, Text } from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useBillingSummary } from "../billing/use-billing-queries";
import { EASE_OUT } from "../issues/issues-motion";
import { canShowTransferTo } from "../members/member-permissions";
import type { OrgMember } from "../members/member-types";
import { memberDisplayName } from "../members/member-types";
import { TransferOwnershipDialog } from "../members/MemberActionDialogs";
import {
  MOCK_CURRENT_USER_ID,
  MOCK_MEMBERS,
} from "../members/mock-members-data";
import {
  useMembersRoster,
  useTransferOwnershipMutation,
} from "../members/use-members-queries";
import { DangerZoneCard, DeletionInProgressBanner } from "./danger-zone-ui";
import { destructiveButtonProps } from "./settings-card-ui";
import { canDeleteOrg } from "./settings-permissions";
import type { OrgDeletionRedirect } from "./settings-types";
import { useDeleteOrganizationMutation } from "./use-settings-queries";

interface TransferOwnershipPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  members: OrgMember[];
  onSelect: (member: OrgMember) => void;
}

function TransferOwnershipPickerDialog({
  open,
  onOpenChange,
  orgName,
  members,
  onSelect,
}: TransferOwnershipPickerDialogProps) {
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
            <Dialog.Title color="fg.primary">Transfer ownership</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Stack gap="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                Choose an admin to become the new owner of {orgName}. You will
                become an Admin after the transfer.
              </Text>
              {members.length === 0 ? (
                <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
                  No eligible admins found. Promote a member to Admin on the
                  Members page first.
                </Text>
              ) : (
                <Stack gap="2">
                  {members.map((member) => (
                    <Button
                      key={member.id}
                      variant="outline"
                      borderRadius="control"
                      borderColor="border.default"
                      justifyContent="flex-start"
                      fontWeight="medium"
                      onClick={() => {
                        onSelect(member);
                        onOpenChange(false);
                      }}
                    >
                      {memberDisplayName(member)}
                      <Text
                        as="span"
                        color="fg.muted"
                        fontWeight="normal"
                        ml="2"
                      >
                        · Admin
                      </Text>
                    </Button>
                  ))}
                </Stack>
              )}
            </Stack>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0">
            <Button
              variant="ghost"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface DeleteOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  hasActivePaidPlan: boolean;
  loading: boolean;
  onConfirm: () => void;
}

function DeleteOrgDialog({
  open,
  onOpenChange,
  orgName,
  hasActivePaidPlan,
  loading,
  onConfirm,
}: DeleteOrgDialogProps) {
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
            <Dialog.Title color="fg.primary">Delete organization</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Stack gap="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                Permanently delete{" "}
                <Text as="span" fontWeight="semibold" color="fg.primary">
                  {orgName}
                </Text>
                ? All projects, issues, comments, and members will be removed.
                This cannot be undone.
              </Text>
              {hasActivePaidPlan && (
                <Text fontSize="sm" color="#92400E" lineHeight="1.6">
                  Your subscription will be canceled and you will not be
                  refunded.
                </Text>
              )}
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
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              {...destructiveButtonProps.solid}
              disabled={!matches}
              loading={loading}
              onClick={onConfirm}
            >
              Delete organization
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function resolveDeletionRedirect(
  redirect: OrgDeletionRedirect,
  navigate: ReturnType<typeof useNavigate>
) {
  switch (redirect.type) {
    case "org":
      toast.success(`Switched to ${redirect.orgName}`);
      void navigate("/projects");
      break;
    case "create-org":
      toast("Create a new organization to keep using Rivet", { icon: "🏢" });
      void navigate("/register");
      break;
    case "login":
      void navigate("/login");
      break;
  }
}

interface OrganizationDangerZoneProps {
  orgId: string;
  orgName: string;
  role: OrganizationRole;
}

export function OrganizationDangerZone({
  orgId,
  orgName,
  role,
}: OrganizationDangerZoneProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<OrgMember | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletionInProgress, setDeletionInProgress] = useState(false);

  const rosterQuery = useMembersRoster(orgId);
  const billingQuery = useBillingSummary(orgId);
  const transferOwnership = useTransferOwnershipMutation(
    orgId,
    MOCK_CURRENT_USER_ID
  );
  const deleteOrg = useDeleteOrganizationMutation(orgId);

  const members = rosterQuery.data?.members ?? MOCK_MEMBERS;
  const eligibleTransferTargets = useMemo(
    () =>
      members.filter((member) =>
        canShowTransferTo(role, member, MOCK_CURRENT_USER_ID)
      ),
    [members, role]
  );

  const hasActivePaidPlan =
    billingQuery.data?.subscription.planTier !== "FREE" &&
    !billingQuery.data?.subscription.cancelAtPeriodEnd;

  if (!canDeleteOrg(role)) return null;

  const handleTransferConfirm = () => {
    if (!transferTarget) return;
    const target = transferTarget;
    transferOwnership.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Ownership transferred to ${memberDisplayName(target)}`);
        setTransferTarget(null);
      },
      onError: () => toast.error("Couldn't transfer ownership — try again"),
    });
  };

  const handleDelete = () => {
    deleteOrg.mutate(undefined, {
      onSuccess: (result) => {
        setDeleteOpen(false);
        setDeletionInProgress(true);
        toast.success(
          "Deletion in progress. This may take a few minutes to complete."
        );
        window.setTimeout(() => {
          resolveDeletionRedirect(result.redirect, navigate);
        }, 1200);
      },
      onError: () => toast.error("Couldn't delete organization — try again"),
    });
  };

  return (
    <>
      {deletionInProgress && (
        <DeletionInProgressBanner message="Deletion in progress. This may take a few minutes to complete." />
      )}

      <Stack gap="4">
        <DangerZoneCard
          label="Transfer ownership"
          description={
            <>
              Transfer ownership of {orgName} to another member. You&apos;ll
              become an Admin after transfer.
            </>
          }
          action={
            <Button
              {...destructiveButtonProps.ghost}
              flexShrink="0"
              onClick={() => setPickerOpen(true)}
            >
              Transfer ownership
            </Button>
          }
        />

        <DangerZoneCard
          label="Delete organization"
          description={
            <>
              Permanently delete {orgName} and all its projects, issues,
              comments, and members. This cannot be undone.
              {hasActivePaidPlan && (
                <Text
                  as="span"
                  display="block"
                  mt="2"
                  color="billing.warning.fg"
                >
                  Your subscription will be canceled and you will not be
                  refunded.
                </Text>
              )}
            </>
          }
          action={
            <Button
              {...destructiveButtonProps.solid}
              flexShrink="0"
              loading={deleteOrg.isPending}
              disabled={deletionInProgress}
              onClick={() => setDeleteOpen(true)}
            >
              Delete organization
            </Button>
          }
        />
      </Stack>

      <TransferOwnershipPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        orgName={orgName}
        members={eligibleTransferTargets}
        onSelect={setTransferTarget}
      />

      <TransferOwnershipDialog
        member={transferTarget}
        orgName={orgName}
        open={transferTarget !== null}
        onOpenChange={(open) => {
          if (!open) setTransferTarget(null);
        }}
        onConfirm={handleTransferConfirm}
      />

      <DeleteOrgDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        orgName={orgName}
        hasActivePaidPlan={hasActivePaidPlan}
        loading={deleteOrg.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

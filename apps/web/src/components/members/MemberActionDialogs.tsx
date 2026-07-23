import { Button, Dialog, Field, Input, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { EASE_OUT } from "../issues/issues-motion";
import type { OrgMember } from "./member-types";
import { memberDisplayName } from "./member-types";
import { countReporterIssues } from "./member-utils";

interface RemoveMemberDialogProps {
  member: OrgMember | null;
  orgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function RemoveMemberDialog({
  member,
  orgName,
  open,
  onOpenChange,
  onConfirm,
}: RemoveMemberDialogProps) {
  if (!member) return null;

  const name = memberDisplayName(member);
  const firstName = member.firstName;
  const reporterCount = countReporterIssues(member.id);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
      role="alertdialog"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content bg="bg.surface" borderRadius="card" maxW="md" mx="4">
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">
              Remove {name} from {orgName}?
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="4">
            <Stack gap="3">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                {firstName} will lose access to all projects immediately.
              </Text>
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                Issues assigned to {firstName} will become unassigned. Comments
                and history remain.
              </Text>
              {reporterCount > 0 && (
                <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                  {firstName} is the reporter on {reporterCount} issue
                  {reporterCount === 1 ? "" : "s"}. These will remain but show
                  as &ldquo;Former member&rdquo;.
                </Text>
              )}
            </Stack>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              variant="ghost"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="status.error"
              color="white"
              _hover={{ bg: "red.600" }}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Remove member
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface TransferOwnershipDialogProps {
  member: OrgMember | null;
  orgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function TransferOwnershipDialog({
  member,
  orgName,
  open,
  onOpenChange,
  onConfirm,
}: TransferOwnershipDialogProps) {
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (!open) setConfirmName("");
  }, [open]);

  if (!member) return null;

  const name = memberDisplayName(member);
  const firstName = member.firstName;
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
            <Dialog.Title color="fg.primary">
              Transfer ownership to {name}?
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Stack gap="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                {firstName} will become the Owner of {orgName}. You will become
                an Admin. This cannot be undone without {firstName} transferring
                back.
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
              variant="ghost"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="accent.default"
              color="white"
              _hover={{ bg: "accent.hover" }}
              disabled={!matches}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Transfer ownership
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface RevokeInviteDialogProps {
  email: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function RevokeInviteDialog({
  email,
  open,
  onOpenChange,
  onConfirm,
}: RevokeInviteDialogProps) {
  if (!email) return null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
      role="alertdialog"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content bg="bg.surface" borderRadius="card" maxW="md" mx="4">
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">Revoke invite?</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="4">
            <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
              The invite link sent to{" "}
              <Text as="span" fontWeight="semibold" color="fg.primary">
                {email}
              </Text>{" "}
              will stop working immediately. They won&apos;t be able to join
              using the existing link.
            </Text>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              variant="ghost"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="status.error"
              color="white"
              _hover={{ bg: "red.600" }}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Revoke invite
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

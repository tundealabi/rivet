import { Button, Dialog, Text } from "@chakra-ui/react";

interface OrgSwitchUnsavedDialogProps {
  open: boolean;
  orgName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function OrgSwitchUnsavedDialog({
  open,
  orgName,
  onOpenChange,
  onConfirm,
}: OrgSwitchUnsavedDialogProps) {
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
            <Dialog.Title color="fg.primary">Unsaved changes</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="4">
            <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
              You have unsaved changes. Switch to {orgName} anyway?
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
              bg="accent.default"
              color="white"
              _hover={{ bg: "accent.hover" }}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Switch anyway
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

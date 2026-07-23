import { Button, Dialog, Flex, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import type { PlanTier } from "../members/member-types";
import {
  downgradeImplications,
  hasDowngradeLimitConflicts,
} from "./billing-plan-data";
import type { OrgUsageSnapshot } from "./billing-types";
import { PLAN_DISPLAY_NAMES } from "./billing-types";

interface BillingDowngradeDialogProps {
  targetTier: PlanTier | null;
  currentTier: PlanTier;
  usage: OrgUsageSnapshot;
  effectiveAt: Date;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function BillingDowngradeDialog({
  targetTier,
  currentTier,
  usage,
  effectiveAt,
  open,
  loading = false,
  onOpenChange,
  onConfirm,
}: BillingDowngradeDialogProps) {
  if (!targetTier) return null;

  const targetName = PLAN_DISPLAY_NAMES[targetTier];
  const implications = downgradeImplications(
    currentTier,
    targetTier,
    usage,
    effectiveAt
  );
  const hasConflicts = hasDowngradeLimitConflicts(targetTier, usage);
  const detailItems = implications.slice(1);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
      role="alertdialog"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content bg="bg.surface" borderRadius="card" maxW="lg" mx="4">
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">
              Downgrade to {targetName}?
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="4">
            <Stack gap="3">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                {implications[0]?.label}
              </Text>

              {detailItems.map((item) => (
                <Flex
                  key={item.label}
                  align="flex-start"
                  gap="2.5"
                  pl="3"
                  borderLeftWidth="2px"
                  borderColor="status.warning"
                >
                  <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                    {item.label}
                    {item.action ? ` — you'll need to ${item.action}` : ""}
                  </Text>
                </Flex>
              ))}

              <Text fontSize="sm" color="fg.muted" lineHeight="1.6" mt="1">
                This can&apos;t be undone without upgrading again. Your current
                plan stays active until the end of this billing period.
              </Text>

              {hasConflicts && (
                <Stack gap="2" pt="1">
                  <Text fontSize="sm" fontWeight="medium" color="fg.primary">
                    Trim usage before downgrading:
                  </Text>
                  <Flex gap="4" flexWrap="wrap">
                    <RouterLink
                      to="/projects"
                      style={{
                        fontSize: "0.875rem",
                        color: "#4F46E5",
                        fontWeight: 500,
                      }}
                      onClick={() => onOpenChange(false)}
                    >
                      Go to Projects →
                    </RouterLink>
                    <RouterLink
                      to="/members"
                      style={{
                        fontSize: "0.875rem",
                        color: "#4F46E5",
                        fontWeight: 500,
                      }}
                      onClick={() => onOpenChange(false)}
                    >
                      Go to Members →
                    </RouterLink>
                  </Flex>
                </Stack>
              )}
            </Stack>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              variant="ghost"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            {hasConflicts ? (
              <Button
                borderRadius="control"
                bg="accent.default"
                color="white"
                _hover={{ bg: "accent.hover" }}
                asChild
              >
                <RouterLink to="/projects" onClick={() => onOpenChange(false)}>
                  Choose what to keep
                </RouterLink>
              </Button>
            ) : (
              <Button
                borderRadius="control"
                bg="status.error"
                color="white"
                _hover={{ bg: "red.600" }}
                loading={loading}
                onClick={onConfirm}
              >
                Schedule downgrade
              </Button>
            )}
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

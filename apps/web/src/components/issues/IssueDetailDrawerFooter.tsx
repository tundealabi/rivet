import { Box, Button, Dialog, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";

import {
  formatProjectIssueKey,
  formatRelativeTime,
  getLastUpdatedBy,
  type Issue,
} from "./issue-types";
import { EASE_OUT } from "./issues-motion";

interface IssueDetailDrawerFooterProps {
  issue: Issue;
  deletable: boolean;
  onDelete: () => void | Promise<void>;
}

export function IssueDetailDrawerFooter({
  issue,
  deletable,
  onDelete,
}: IssueDetailDrawerFooterProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const issueKey = formatProjectIssueKey(issue);
  const updatedBy = getLastUpdatedBy(issue);

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap="3"
        px="4"
        py="3"
        minH="11"
        borderTopWidth="1px"
        borderColor="border.default"
        bg="bg.surface"
        flexShrink="0"
      >
        <Text fontSize="xs" color="fg.muted" truncate>
          Last updated {formatRelativeTime(issue.updatedAt)} by {updatedBy}
        </Text>

        {deletable && (
          <Box
            as="button"
            fontSize="xs"
            fontWeight="bold"
            color="status.error"
            flexShrink="0"
            bg="transparent"
            border="none"
            cursor="pointer"
            p="0"
            transition="color 0.15s ease"
            _hover={{ color: "red.700" }}
            onClick={() => setDeleteOpen(true)}
          >
            Delete issue
          </Box>
        )}
      </Flex>

      <Dialog.Root
        open={deleteOpen}
        onOpenChange={(e) => {
          if (!e.open && deleting) return;
          setDeleteOpen(e.open);
        }}
        placement="center"
      >
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.surface"
            borderRadius="card"
            maxW="sm"
            w="full"
            mx="4"
            boxShadow="elevated"
            animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
          >
            <Dialog.Header pt="6" px="6" pb="0">
              <Dialog.Title color="fg.primary">Delete {issueKey}?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body px="6" py="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                This cannot be undone.
              </Text>
            </Dialog.Body>
            <Dialog.Footer px="6" pb="6" pt="0" gap="3">
              <Button
                variant="outline"
                borderRadius="control"
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                borderRadius="control"
                bg="status.error"
                color="white"
                loading={deleting}
                _hover={{ bg: "red.600" }}
                onClick={() => {
                  void (async () => {
                    try {
                      setDeleting(true);
                      await onDelete();
                      setDeleteOpen(false);
                    } catch {
                      // Page handler already surfaced the error.
                    } finally {
                      setDeleting(false);
                    }
                  })();
                }}
              >
                Delete issue
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}

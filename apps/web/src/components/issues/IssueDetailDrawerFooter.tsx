import { Box, Button, Dialog, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";
import toast from "react-hot-toast";

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
  onDelete: () => void;
}

export function IssueDetailDrawerFooter({
  issue,
  deletable,
  onDelete,
}: IssueDetailDrawerFooterProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const issueKey = formatProjectIssueKey(issue);
  const updatedBy = getLastUpdatedBy(issue);

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap="3"
        px="4"
        py="2"
        minH="9"
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
            fontWeight="medium"
            color="red.400"
            flexShrink="0"
            bg="transparent"
            border="none"
            cursor="pointer"
            p="0"
            transition="color 0.15s ease"
            _hover={{ color: "red.500" }}
            onClick={() => setDeleteOpen(true)}
          >
            Delete issue
          </Box>
        )}
      </Flex>

      <Dialog.Root
        open={deleteOpen}
        onOpenChange={(e) => setDeleteOpen(e.open)}
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
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                borderRadius="control"
                bg="status.error"
                color="white"
                _hover={{ bg: "red.600" }}
                onClick={() => {
                  setDeleteOpen(false);
                  onDelete();
                  toast.success("Issue deleted");
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

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  Flex,
  HStack,
  Input,
  Link,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { EASE_OUT } from "../issues/issues-motion";
import {
  collectInviteEmails,
  isValidEmail,
  parseInviteEmails,
} from "./invite-utils";
import { type PendingInvite, PLAN_LABELS, ROLE_LABELS } from "./member-types";

const INVITE_TTL_DAYS = 7;
const SEAT_WARNING = "#D97706";

const INVITE_ROLES: {
  value: OrganizationRole;
  label: string;
  description: string;
}[] = [
  {
    value: OrganizationRole.ADMIN,
    label: ROLE_LABELS[OrganizationRole.ADMIN],
    description: "Can invite members and manage all projects",
  },
  {
    value: OrganizationRole.MEMBER,
    label: ROLE_LABELS[OrganizationRole.MEMBER],
    description: "Can create and edit issues in all projects",
  },
  {
    value: OrganizationRole.VIEWER,
    label: ROLE_LABELS[OrganizationRole.VIEWER],
    description: "Read-only access to all projects",
  },
];

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (invites: PendingInvite[]) => Promise<void>;
  orgName: string;
  seatsUsed: number;
  seatLimit: number;
  existingEmails: Set<string>;
  onUpgrade: () => void;
}

function EmailChip({
  email,
  onRemove,
}: {
  email: string;
  onRemove: () => void;
}) {
  return (
    <Flex
      align="center"
      gap="1.5"
      px="2.5"
      py="1"
      borderRadius="badge"
      bg="bg.surfaceHover"
      borderWidth="1px"
      borderColor="border.default"
      fontSize="xs"
      color="fg.primary"
      maxW="full"
    >
      <Text truncate>{email}</Text>
      <CloseButton
        size="2xs"
        variant="ghost"
        color="fg.muted"
        aria-label={`Remove ${email}`}
        onClick={onRemove}
      />
    </Flex>
  );
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvite,
  orgName,
  seatsUsed,
  seatLimit,
  existingEmails,
  onUpgrade,
}: InviteMemberDialogProps) {
  const [emailChips, setEmailChips] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [role, setRole] = useState<OrganizationRole>(OrganizationRole.MEMBER);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const reset = () => {
    setEmailChips([]);
    setEmailInput("");
    setEmailError("");
    setRole(OrganizationRole.MEMBER);
    setMessage("");
    setSending(false);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const formDisabled = sending;

  const remainingSeats = Math.max(0, seatLimit - seatsUsed);

  const { valid: parsedEmails } = useMemo(
    () => collectInviteEmails(emailChips, emailInput),
    [emailChips, emailInput]
  );

  const newEmails = useMemo(
    () => parsedEmails.filter((email) => !existingEmails.has(email)),
    [parsedEmails, existingEmails]
  );

  const inviteCount = newEmails.length;
  const seatsToUse = Math.min(inviteCount, remainingSeats);
  const overSeatLimit = inviteCount > remainingSeats && inviteCount > 0;

  const commitInputTokens = (raw: string) => {
    const tokens = parseInviteEmails(raw);
    if (tokens.length === 0) return;

    const nextValid: string[] = [];
    const nextInvalid: string[] = [];

    for (const token of tokens) {
      if (isValidEmail(token)) {
        nextValid.push(token);
      } else {
        nextInvalid.push(token);
      }
    }

    if (nextValid.length > 0) {
      setEmailChips((prev) => [...new Set([...prev, ...nextValid])]);
    }

    setEmailInput(nextInvalid.join(", "));
    setEmailError(nextInvalid.length > 0 ? "Enter valid email addresses" : "");
  };

  const handleEmailChange = (value: string) => {
    if (/[,\n]/.test(value)) {
      commitInputTokens(value);
      return;
    }
    setEmailInput(value);
    if (emailError) setEmailError("");
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      commitInputTokens(emailInput);
    }
  };

  const handleEmailBlur = () => {
    if (emailInput.trim()) commitInputTokens(emailInput);
  };

  const handleSend = async () => {
    if (sending) return;

    let mergedChips = emailChips;
    let mergedInput = emailInput;

    if (emailInput.trim()) {
      const tokens = parseInviteEmails(emailInput);
      const nextValid: string[] = [];
      const nextInvalid: string[] = [];

      for (const token of tokens) {
        if (isValidEmail(token)) {
          nextValid.push(token);
        } else {
          nextInvalid.push(token);
        }
      }

      mergedChips = [...new Set([...emailChips, ...nextValid])];
      mergedInput = nextInvalid.join(", ");

      if (nextInvalid.length > 0) {
        setEmailError("Enter valid email addresses");
        setEmailChips(mergedChips);
        setEmailInput(mergedInput);
        return;
      }
    }

    const { valid, invalid } = collectInviteEmails(mergedChips, mergedInput);
    const toInvite = valid.filter((email) => !existingEmails.has(email));

    if (invalid.length > 0) {
      setEmailError("Enter valid email addresses");
      return;
    }

    if (toInvite.length === 0) {
      setEmailError("Add at least one email address");
      return;
    }

    const batch = toInvite.slice(0, remainingSeats);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    const invites: PendingInvite[] = batch.map((email) => ({
      id: crypto.randomUUID(),
      email,
      role,
      invitedBy: { id: "1", name: "Ada Lovelace", initials: "AL" },
      sentAt: now,
      expiresAt,
      inviteToken: `tok_${crypto.randomUUID().slice(0, 8)}`,
      status: "pending" as const,
    }));

    setSending(true);
    try {
      await onInvite(invites);
      reset();
      onOpenChange(false);
    } catch {
      setSending(false);
      toast.error("Couldn't send invites — try again");
    }
  };

  const seatPreview =
    inviteCount === 0
      ? `${remainingSeats} seat${remainingSeats === 1 ? "" : "s"} remaining`
      : overSeatLimit
        ? `This will use ${seatsToUse} of your remaining ${remainingSeats} seat${remainingSeats === 1 ? "" : "s"}`
        : `This will use ${inviteCount} of your remaining ${remainingSeats} seat${remainingSeats === 1 ? "" : "s"}`;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (sending) return;
        if (!e.open) reset();
        onOpenChange(e.open);
      }}
      placement="center"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.surface"
          borderRadius="card"
          maxW="480px"
          w="full"
          mx="4"
          animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
        >
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">Invite to {orgName}</Dialog.Title>
          </Dialog.Header>

          <Dialog.Body px="6" py="5">
            <Stack gap="4">
              {overSeatLimit && (
                <Box
                  px="3.5"
                  py="3"
                  borderRadius="control"
                  bg="orange.50"
                  borderWidth="1px"
                  borderColor="orange.200"
                  fontSize="sm"
                  color="fg.secondary"
                  lineHeight="1.5"
                >
                  You&apos;re inviting {inviteCount} people but only have{" "}
                  {remainingSeats} seat
                  {remainingSeats === 1 ? "" : "s"} left.{" "}
                  <Link
                    as="button"
                    color="accent.default"
                    fontWeight="medium"
                    onClick={onUpgrade}
                  >
                    Upgrade to {PLAN_LABELS.TEAM.replace(" plan", "")}
                  </Link>
                  , or invite {remainingSeats} for now.
                </Box>
              )}

              <Field.Root invalid={!!emailError}>
                <Field.Label color="fg.primary">Email</Field.Label>
                <Input
                  type="text"
                  placeholder="colleague@company.com, or one per line"
                  borderRadius="control"
                  value={emailInput}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  onBlur={handleEmailBlur}
                  disabled={formDisabled}
                  autoFocus
                />
                <Field.HelperText color="fg.muted" fontSize="xs">
                  Separate multiple emails with commas or newlines
                </Field.HelperText>
                <Field.ErrorText>{emailError}</Field.ErrorText>
              </Field.Root>

              {(emailChips.length > 0 || parsedEmails.length > 0) && (
                <Flex gap="2" flexWrap="wrap">
                  {parsedEmails.map((email) => (
                    <EmailChip
                      key={email}
                      email={email}
                      onRemove={() => {
                        setEmailChips((prev) =>
                          prev.filter((item) => item !== email)
                        );
                        if (emailInput.includes(email)) {
                          setEmailInput((prev) =>
                            parseInviteEmails(prev)
                              .filter((item) => item !== email)
                              .join(", ")
                          );
                        }
                      }}
                    />
                  ))}
                </Flex>
              )}

              <Field.Root>
                <Field.Label color="fg.primary">Role</Field.Label>
                <Stack gap="2">
                  {INVITE_ROLES.map((option) => {
                    const selected = role === option.value;
                    return (
                      <Box
                        key={option.value}
                        as="button"
                        w="full"
                        textAlign="left"
                        px="3.5"
                        py="3"
                        borderRadius="control"
                        borderWidth="1px"
                        borderColor={
                          selected ? "accent.default" : "border.default"
                        }
                        bg={selected ? "brand.subtle" : "bg.surface"}
                        cursor="pointer"
                        transition="border-color 0.15s ease, background-color 0.15s ease"
                        _hover={{
                          borderColor: selected ? "accent.default" : "fg.muted",
                        }}
                        onClick={() => setRole(option.value)}
                        opacity={formDisabled ? 0.6 : 1}
                        pointerEvents={formDisabled ? "none" : "auto"}
                      >
                        <Flex align="flex-start" gap="3">
                          <Box
                            mt="0.5"
                            boxSize="4"
                            borderRadius="full"
                            borderWidth="2px"
                            borderColor={
                              selected ? "accent.default" : "border.default"
                            }
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink="0"
                          >
                            {selected && (
                              <Box
                                boxSize="2"
                                borderRadius="full"
                                bg="accent.default"
                              />
                            )}
                          </Box>
                          <Box minW="0">
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color="fg.primary"
                            >
                              {option.label}
                            </Text>
                            <Text
                              fontSize="xs"
                              color="fg.secondary"
                              mt="0.5"
                              lineHeight="1.5"
                            >
                              {option.description}
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                    );
                  })}
                </Stack>
              </Field.Root>

              <Field.Root>
                <Field.Label color="fg.primary">
                  Add a personal message (optional)
                </Field.Label>
                <Textarea
                  placeholder="Looking forward to working with you!"
                  borderRadius="control"
                  rows={3}
                  resize="vertical"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={formDisabled}
                />
              </Field.Root>
            </Stack>
          </Dialog.Body>

          <Dialog.Footer px="6" pb="6" pt="0">
            <Flex
              w="full"
              align={{ base: "stretch", sm: "center" }}
              justify="space-between"
              direction={{ base: "column", sm: "row" }}
              gap="4"
            >
              <Text
                fontSize="sm"
                color={overSeatLimit ? SEAT_WARNING : "fg.secondary"}
              >
                {seatPreview}
              </Text>
              <HStack gap="2" justify={{ base: "stretch", sm: "flex-end" }}>
                <Button
                  variant="ghost"
                  borderRadius="control"
                  onClick={() => onOpenChange(false)}
                  disabled={formDisabled}
                >
                  Cancel
                </Button>
                <Button
                  borderRadius="control"
                  bg="accent.default"
                  color="white"
                  _hover={{ bg: "accent.hover" }}
                  disabled={
                    inviteCount === 0 || remainingSeats === 0 || sending
                  }
                  loading={sending}
                  onClick={() => void handleSend()}
                >
                  Send invite{seatsToUse === 1 ? "" : "s"}
                </Button>
              </HStack>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

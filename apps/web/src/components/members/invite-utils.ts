const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/** Split raw input on commas or newlines and normalize. */
export function parseInviteEmails(raw: string): string[] {
  return raw
    .split(/[,\n]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function dedupeEmails(emails: string[]): string[] {
  return [...new Set(emails)];
}

export interface ParsedInviteInput {
  valid: string[];
  invalid: string[];
}

export function partitionInviteEmails(raw: string): ParsedInviteInput {
  const parts = parseInviteEmails(raw);
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const part of parts) {
    if (isValidEmail(part)) {
      valid.push(part);
    } else {
      invalid.push(part);
    }
  }

  return { valid: dedupeEmails(valid), invalid };
}

export function collectInviteEmails(
  chips: string[],
  pendingInput: string
): ParsedInviteInput {
  const fromInput = partitionInviteEmails(pendingInput);
  return {
    valid: dedupeEmails([...chips, ...fromInput.valid]),
    invalid: fromInput.invalid,
  };
}

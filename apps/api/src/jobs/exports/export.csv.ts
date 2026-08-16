export const CSV_COLUMNS = [
  "key",
  "title",
  "description",
  "status",
  "priority",
  "assignee",
  "project",
  "created_at",
  "updated_at",
] as const;

const FORMULA_PREFIX = /^[=+\-@]/;
const NEEDS_QUOTES = /[",\r\n]/;

export type CsvIssueRow = {
  assignee: { firstName: string; lastName: string } | null;
  createdAt: Date;
  description: string;
  number: number;
  priority: string;
  project: { key: string; name: string };
  status: string;
  title: string;
  updatedAt: Date;
};

export function encodeCsvHeader(): string {
  return `${CSV_COLUMNS.join(",")}\r\n`;
}

export function encodeCsvRow(row: CsvIssueRow): string {
  const cells = [
    `${row.project.key}-${row.number}`,
    row.title,
    row.description,
    row.status,
    row.priority,
    formatAssignee(row.assignee),
    row.project.name,
    row.createdAt.toISOString(),
    row.updatedAt.toISOString(),
  ];

  return `${cells.map(encodeCsvCell).join(",")}\r\n`;
}

export async function* encodeCsv(
  rows: AsyncIterable<CsvIssueRow>
): AsyncGenerator<string> {
  yield encodeCsvHeader();
  for await (const row of rows) {
    yield encodeCsvRow(row);
  }
}

function formatAssignee(assignee: CsvIssueRow["assignee"]): string {
  if (!assignee) {
    return "";
  }

  return `${assignee.firstName} ${assignee.lastName}`.trim();
}

function encodeCsvCell(value: string): string {
  const sanitized = FORMULA_PREFIX.test(value) ? `'${value}` : value;

  if (NEEDS_QUOTES.test(sanitized)) {
    return `"${sanitized.replaceAll('"', '""')}"`;
  }

  return sanitized;
}

import {
  type CsvIssueRow,
  encodeCsv,
  encodeCsvHeader,
  encodeCsvRow,
} from "./export.csv";

const baseRow: CsvIssueRow = {
  assignee: { firstName: "Ada", lastName: "Lovelace" },
  createdAt: new Date("2026-08-15T12:00:00.000Z"),
  description: "plain",
  number: 7,
  priority: "HIGH",
  project: { key: "RIV", name: "Rivet" },
  status: "TODO",
  title: "Ship export",
  updatedAt: new Date("2026-08-15T13:00:00.000Z"),
};

async function* asyncOf<T>(...items: T[]): AsyncGenerator<T> {
  await Promise.resolve();
  yield* items;
}

describe("export CSV encoder", () => {
  it("writes RFC 4180 header columns in ADR order with CRLF and no BOM", () => {
    const header = encodeCsvHeader();
    expect(header.charCodeAt(0)).not.toBe(0xfeff);
    expect(header.startsWith("\uFEFF")).toBe(false);
    expect(header).toBe(
      "key,title,description,status,priority,assignee,project,created_at,updated_at\r\n"
    );
  });

  it("formats key, assignee display name, and ISO-8601 UTC timestamps", () => {
    expect(encodeCsvRow(baseRow)).toBe(
      "RIV-7,Ship export,plain,TODO,HIGH,Ada Lovelace,Rivet,2026-08-15T12:00:00.000Z,2026-08-15T13:00:00.000Z\r\n"
    );
  });

  it("uses an empty assignee cell when unassigned", () => {
    const row = encodeCsvRow({ ...baseRow, assignee: null });
    expect(row.split(",")[5]).toBe("");
  });

  it("quotes comma and newline and doubles embedded quotes", () => {
    const row = encodeCsvRow({
      ...baseRow,
      description: 'hello, "world"\nnext',
    });
    expect(row).toContain('"hello, ""world""\nnext"');
  });

  it.each(["=cmd", "+cmd", "-cmd", "@cmd"])(
    "prefixes formula-like cell %s",
    (title) => {
      const row = encodeCsvRow({ ...baseRow, title });
      expect(row.split(",")[1]).toBe(`'${title}`);
    }
  );

  it("prefixes injection before quoting a formula cell that also needs quotes", () => {
    const row = encodeCsvRow({
      ...baseRow,
      description: "=cmd, and a newline\nhere",
    });
    expect(row).toContain('"\'=cmd, and a newline\nhere"');
  });

  it("streams a header then rows", async () => {
    const chunks: string[] = [];
    for await (const chunk of encodeCsv(asyncOf(baseRow))) {
      chunks.push(chunk);
    }

    expect(chunks[0]).toBe(encodeCsvHeader());
    expect(chunks[1]).toBe(encodeCsvRow(baseRow));
  });
});

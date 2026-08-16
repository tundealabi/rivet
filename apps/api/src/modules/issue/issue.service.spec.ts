import { IssuePriority, IssueStatus } from "@generated/prisma";

import { DatabaseService } from "@/database/database.service";

import { issueExportSelect, issueListOrderBy } from "./issue.constants";
import { IssueRepository } from "./issue.repository";
import { IssueService } from "./issue.service";
import type { IssueExportRow } from "./issue.types";

function exportRow(
  overrides: Partial<IssueExportRow> & Pick<IssueExportRow, "id">
): IssueExportRow {
  return {
    assignee: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    description: "",
    number: 1,
    priority: IssuePriority.MEDIUM,
    project: { key: "RIV", name: "Rivet" },
    status: IssueStatus.TODO,
    title: "Issue",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

async function collect(
  iterator: AsyncIterable<IssueExportRow>
): Promise<IssueExportRow[]> {
  const rows: IssueExportRow[] = [];
  for await (const row of iterator) {
    rows.push(row);
  }
  return rows;
}

describe("IssueService.iterateForExport", () => {
  it("selects CSV fields and pages with the list keyset", async () => {
    const pageSize = 2;
    const page1 = Array.from({ length: pageSize }, (_, i) =>
      exportRow({
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 100 - i)),
        id: `id-${String(i).padStart(3, "0")}`,
        number: i + 1,
      })
    );
    const page2 = [
      exportRow({
        createdAt: new Date("2025-12-31T00:00:00.000Z"),
        id: "id-last",
        number: 101,
      }),
    ];

    const findMany = jest
      .fn()
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const service = new IssueService(
      {} as DatabaseService,
      { findMany } as unknown as IssueRepository
    );

    const rows = await collect(
      service.iterateForExport({ limit: pageSize, projectId: "project-1" })
    );

    expect(rows).toHaveLength(pageSize + 1);
    expect(findMany).toHaveBeenCalledTimes(2);
    expect(findMany.mock.calls[0][0]).toEqual({
      orderBy: [...issueListOrderBy],
      select: issueExportSelect,
      take: pageSize,
      where: { projectId: "project-1" },
    });
    expect(findMany.mock.calls[1][0]).toMatchObject({
      where: {
        projectId: "project-1",
        OR: [
          { createdAt: { lt: page1.at(-1)?.createdAt } },
          {
            AND: [
              { createdAt: page1.at(-1)?.createdAt },
              { id: { lt: page1.at(-1)?.id } },
            ],
          },
        ],
      },
    });
  });

  it("applies the same assignee/status/priority filters as list", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new IssueService(
      {} as DatabaseService,
      { findMany } as unknown as IssueRepository
    );

    await collect(
      service.iterateForExport({
        assigneeId: null,
        limit: 100,
        priority: IssuePriority.HIGH,
        projectId: "project-1",
        status: IssueStatus.IN_PROGRESS,
      })
    );

    expect(findMany.mock.calls[0][0].where).toEqual({
      assigneeId: null,
      priority: IssuePriority.HIGH,
      projectId: "project-1",
      status: IssueStatus.IN_PROGRESS,
    });
  });

  it("filters a specific assignee when assigneeId is set", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new IssueService(
      {} as DatabaseService,
      { findMany } as unknown as IssueRepository
    );

    await collect(
      service.iterateForExport({
        assigneeId: "user-1",
        limit: 100,
        projectId: "project-1",
      })
    );

    expect(findMany.mock.calls[0][0].where).toEqual({
      assigneeId: "user-1",
      projectId: "project-1",
    });
  });
});

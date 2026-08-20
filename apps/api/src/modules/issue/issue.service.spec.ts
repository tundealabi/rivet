import {
  IssueActivityField,
  IssuePriority,
  IssueStatus,
} from "@generated/prisma";

import { DatabaseService } from "@/database/database.service";

import {
  issueActivityActorInclude,
  issueActivityListOrderBy,
  issueCommentAuthorInclude,
  issueCommentListOrderBy,
  issueExportSelect,
  issueListOrderBy,
} from "./issue.constants";
import { IssueRepository } from "./issue.repository";
import { IssueService } from "./issue.service";
import type {
  IssueActivityWithActor,
  IssueCommentWithAuthor,
  IssueExportRow,
} from "./issue.types";

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

describe("IssueService.listComments", () => {
  it("pages oldest-first with the comment keyset", async () => {
    const pageSize = 2;
    const page1 = [
      commentRow({
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        id: "c-001",
      }),
      commentRow({
        createdAt: new Date("2026-01-01T00:00:01.000Z"),
        id: "c-002",
      }),
    ];
    const extra = commentRow({
      createdAt: new Date("2026-01-01T00:00:02.000Z"),
      id: "c-003",
    });

    const findManyComment = jest.fn().mockResolvedValue([...page1, extra]);

    const service = new IssueService(
      {} as DatabaseService,
      {
        findManyComment,
      } as unknown as IssueRepository
    );

    const result = await service.listComments({
      issueId: "issue-1",
      limit: pageSize,
    });

    expect(result.items).toHaveLength(pageSize);
    expect(result.next).toEqual({
      createdAt: page1[1]?.createdAt,
      id: "c-002",
    });
    expect(findManyComment).toHaveBeenCalledWith(
      {
        include: issueCommentAuthorInclude,
        orderBy: [...issueCommentListOrderBy],
        take: pageSize + 1,
        where: { issueId: "issue-1" },
      },
      undefined
    );
  });

  it("applies the after cursor with gt on createdAt/id", async () => {
    const findManyComment = jest.fn().mockResolvedValue([]);
    const service = new IssueService(
      {} as DatabaseService,
      {
        findManyComment,
      } as unknown as IssueRepository
    );

    const after = {
      createdAt: new Date("2026-01-01T00:00:01.000Z"),
      id: "c-002",
    };

    await service.listComments({
      after,
      issueId: "issue-1",
      limit: 20,
    });

    expect(findManyComment.mock.calls[0][0].where).toEqual({
      issueId: "issue-1",
      OR: [
        { createdAt: { gt: after.createdAt } },
        {
          AND: [{ createdAt: after.createdAt }, { id: { gt: after.id } }],
        },
      ],
    });
  });
});

describe("IssueService.listActivity", () => {
  it("pages newest-first with the activity keyset", async () => {
    const pageSize = 2;
    const page1 = [
      activityRow({
        createdAt: new Date("2026-01-01T00:00:02.000Z"),
        id: "a-003",
      }),
      activityRow({
        createdAt: new Date("2026-01-01T00:00:01.000Z"),
        id: "a-002",
      }),
    ];
    const extra = activityRow({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      id: "a-001",
    });

    const findManyActivity = jest.fn().mockResolvedValue([...page1, extra]);

    const service = new IssueService(
      {} as DatabaseService,
      {
        findManyActivity,
      } as unknown as IssueRepository
    );

    const result = await service.listActivity({
      issueId: "issue-1",
      limit: pageSize,
    });

    expect(result.items).toHaveLength(pageSize);
    expect(result.next).toEqual({
      createdAt: page1[1]?.createdAt,
      id: "a-002",
    });
    expect(findManyActivity).toHaveBeenCalledWith(
      {
        include: issueActivityActorInclude,
        orderBy: [...issueActivityListOrderBy],
        take: pageSize + 1,
        where: { issueId: "issue-1" },
      },
      undefined
    );
  });

  it("applies the after cursor with lt on createdAt/id", async () => {
    const findManyActivity = jest.fn().mockResolvedValue([]);
    const service = new IssueService(
      {} as DatabaseService,
      {
        findManyActivity,
      } as unknown as IssueRepository
    );

    const after = {
      createdAt: new Date("2026-01-01T00:00:01.000Z"),
      id: "a-002",
    };

    await service.listActivity({
      after,
      issueId: "issue-1",
      limit: 20,
    });

    expect(findManyActivity.mock.calls[0][0].where).toEqual({
      issueId: "issue-1",
      OR: [
        { createdAt: { lt: after.createdAt } },
        {
          AND: [{ createdAt: after.createdAt }, { id: { lt: after.id } }],
        },
      ],
    });
  });
});

function commentRow(
  overrides: Partial<IssueCommentWithAuthor> &
    Pick<IssueCommentWithAuthor, "id">
): IssueCommentWithAuthor {
  return {
    author: {
      firstName: "Ada",
      id: "user-1",
      lastName: "Lovelace",
    },
    authorId: "user-1",
    body: "Comment",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    issueId: "issue-1",
    organizationId: "org-1",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function activityRow(
  overrides: Partial<IssueActivityWithActor> &
    Pick<IssueActivityWithActor, "id">
): IssueActivityWithActor {
  return {
    actor: {
      firstName: "Ada",
      id: "user-1",
      lastName: "Lovelace",
    },
    actorId: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    field: IssueActivityField.TITLE,
    fromValue: "Old",
    issueId: "issue-1",
    organizationId: "org-1",
    toValue: "New",
    ...overrides,
  };
}

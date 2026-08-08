import { IssueStatus } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DbOptions } from "@/database/database.types";

import { issueAssigneeInclude } from "./issue.constants";
import { IssueRepository } from "./issue.repository";
import {
  CreateIssueInput,
  FindIssueByIdInput,
  IssueWithAssignee,
  ListIssuesInput,
  ListIssuesResult,
  SummarizeIssuesInput,
  SummarizeIssuesResult,
  UpdateIssueInput,
} from "./issue.types";

const EMPTY_STATUS_COUNTS = {
  BACKLOG: 0,
  TODO: 0,
  IN_PROGRESS: 0,
  IN_REVIEW: 0,
  DONE: 0,
  CANCELLED: 0,
} as const;

const OPEN_STATUSES = new Set<IssueStatus>([
  IssueStatus.BACKLOG,
  IssueStatus.TODO,
  IssueStatus.IN_PROGRESS,
  IssueStatus.IN_REVIEW,
]);

@Injectable()
export class IssueService {
  constructor(private readonly issueRepository: IssueRepository) {}

  async create(
    input: CreateIssueInput,
    options?: DbOptions
  ): Promise<IssueWithAssignee> {
    return this.issueRepository.create(
      {
        data: {
          assigneeId: input.assigneeId,
          description: input.description,
          number: input.number,
          organizationId: input.organizationId,
          priority: input.priority,
          projectId: input.projectId,
          status: input.status,
          title: input.title,
        },
        include: issueAssigneeInclude,
      },
      options
    ) as Promise<IssueWithAssignee>;
  }

  async findById(
    input: FindIssueByIdInput,
    options?: DbOptions
  ): Promise<IssueWithAssignee | null> {
    return this.issueRepository.findFirst(
      {
        include: issueAssigneeInclude,
        where: { id: input.id },
      },
      options
    ) as Promise<IssueWithAssignee | null>;
  }

  async list(
    input: ListIssuesInput,
    options?: DbOptions
  ): Promise<ListIssuesResult> {
    const { after, assigneeId, limit, priority, projectId, status } = input;

    const issues = (await this.issueRepository.findMany(
      {
        include: issueAssigneeInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        where: {
          projectId,
          ...(assigneeId === null
            ? { assigneeId: null }
            : assigneeId
              ? { assigneeId }
              : {}),
          ...(priority ? { priority } : {}),
          ...(status ? { status } : {}),
          ...(after
            ? {
                OR: [
                  { createdAt: { lt: after.createdAt } },
                  {
                    AND: [
                      { createdAt: after.createdAt },
                      { id: { lt: after.id } },
                    ],
                  },
                ],
              }
            : {}),
        },
      },
      options
    )) as IssueWithAssignee[];

    const hasMore = issues.length > limit;
    const items = hasMore ? issues.slice(0, limit) : issues;
    const lastItem = items.at(-1);

    return {
      items,
      next:
        hasMore && lastItem
          ? {
              createdAt: lastItem.createdAt,
              id: lastItem.id,
            }
          : undefined,
    };
  }

  async summarize(
    input: SummarizeIssuesInput,
    options?: DbOptions
  ): Promise<SummarizeIssuesResult> {
    const rows = await this.issueRepository.groupBy(
      {
        by: ["status"],
        where: { projectId: input.projectId },
        _count: true,
      },
      options
    );

    const byStatus = { ...EMPTY_STATUS_COUNTS };
    let total = 0;
    let open = 0;

    for (const row of rows) {
      const count = typeof row._count === "number" ? row._count : 0;
      byStatus[row.status] = count;
      total += count;
      if (OPEN_STATUSES.has(row.status)) {
        open += count;
      }
    }

    return { byStatus, open, total };
  }

  async update(
    id: string,
    input: UpdateIssueInput,
    options?: DbOptions
  ): Promise<IssueWithAssignee | null> {
    return this.issueRepository.update(
      {
        where: { id },
        data: {
          assigneeId: input.assigneeId,
          description: input.description,
          priority: input.priority,
          status: input.status,
          title: input.title,
        },
        include: issueAssigneeInclude,
      },
      options
    ) as Promise<IssueWithAssignee | null>;
  }
}

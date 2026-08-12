import { IssueActivityField, IssueStatus } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import {
  ErrorCode,
  ErrorMessage,
  isIssueStatusTransitionAllowed,
  IssueStatus as SharedIssueStatus,
} from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import type { AppPrismaClientLike } from "@/database/tenant-prisma.extension";
import { Prisma } from "@/generated/prisma/client";

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
  UpdateIssueCurrent,
  UpdateIssueIfCurrentInput,
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
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly issueRepository: IssueRepository
  ) {}

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

  async getById(
    input: FindIssueByIdInput,
    options?: DbOptions
  ): Promise<IssueWithAssignee> {
    const issue = await this.findById(input, options);

    if (!issue) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return issue;
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
    input: UpdateIssueInput,
    options?: DbOptions
  ): Promise<IssueWithAssignee> {
    return this.applyUpdate(input, undefined, options);
  }

  async updateIfCurrent(
    input: UpdateIssueIfCurrentInput,
    options?: DbOptions
  ): Promise<IssueWithAssignee | null> {
    return this.applyUpdate(input, input.current, options);
  }

  private applyUpdate(
    input: UpdateIssueInput,
    current: undefined,
    options?: DbOptions
  ): Promise<IssueWithAssignee>;
  private applyUpdate(
    input: UpdateIssueInput,
    current: UpdateIssueCurrent,
    options?: DbOptions
  ): Promise<IssueWithAssignee | null>;
  private async applyUpdate(
    input: UpdateIssueInput,
    current: UpdateIssueCurrent | undefined,
    options?: DbOptions
  ): Promise<IssueWithAssignee | null> {
    const execute = async (tx: AppPrismaClientLike) => {
      const dbOptions = { tx };
      const existing = await this.getById({ id: input.id }, dbOptions);

      if (current && !this.matchesCurrent(existing, current)) {
        return null;
      }

      if (
        input.status !== undefined &&
        !isIssueStatusTransitionAllowed(
          existing.status as SharedIssueStatus,
          input.status as SharedIssueStatus
        )
      ) {
        throw new DomainError(
          "RULE_VIOLATION",
          ErrorCode.ISSUE_STATUS_TRANSITION,
          ErrorMessage.ISSUE_STATUS_TRANSITION
        );
      }

      const data = {
        assigneeId: input.assigneeId,
        description: input.description,
        priority: input.priority,
        status: input.status,
        title: input.title,
      };

      if (current) {
        const result = await this.issueRepository.updateMany(
          {
            data,
            where: {
              id: input.id,
              ...(current.assigneeId !== undefined
                ? { assigneeId: current.assigneeId }
                : {}),
              ...(current.description !== undefined
                ? { description: current.description }
                : {}),
              ...(current.status !== undefined
                ? { status: current.status }
                : {}),
            },
          },
          dbOptions
        );

        if (result.count === 0) {
          return null;
        }
      } else {
        const updated = await this.issueRepository.update(
          {
            data,
            include: issueAssigneeInclude,
            where: { id: input.id },
          },
          dbOptions
        );

        if (!updated) {
          throw new DomainError(
            "NOT_FOUND",
            ErrorCode.NOT_FOUND,
            ErrorMessage.NOT_FOUND
          );
        }
      }

      const activities = this.buildActivities(existing, input);

      if (activities.length > 0) {
        await this.issueRepository.createManyActivity(
          { data: activities },
          dbOptions
        );
      }

      return this.getById({ id: input.id }, dbOptions);
    };

    if (options?.tx) {
      return execute(options.tx);
    }

    return this.databaseService.client.$transaction((tx) => execute(tx));
  }

  private matchesCurrent(
    issue: IssueWithAssignee,
    current: UpdateIssueCurrent
  ): boolean {
    if (current.status !== undefined && current.status !== issue.status) {
      return false;
    }

    if (
      current.assigneeId !== undefined &&
      current.assigneeId !== issue.assigneeId
    ) {
      return false;
    }

    if (
      current.description !== undefined &&
      current.description !== issue.description
    ) {
      return false;
    }

    return true;
  }

  private buildActivities(
    existing: IssueWithAssignee,
    input: UpdateIssueInput
  ): Prisma.IssueActivityCreateManyInput[] {
    const rows: Prisma.IssueActivityCreateManyInput[] = [];
    const base = {
      actorId: input.actorId,
      issueId: existing.id,
      organizationId: existing.organizationId,
    };

    if (input.title !== undefined && input.title !== existing.title) {
      rows.push({
        ...base,
        field: IssueActivityField.TITLE,
        fromValue: existing.title,
        toValue: input.title,
      });
    }

    if (
      input.description !== undefined &&
      input.description !== existing.description
    ) {
      rows.push({
        ...base,
        field: IssueActivityField.DESCRIPTION,
        fromValue: existing.description,
        toValue: input.description,
      });
    }

    if (input.priority !== undefined && input.priority !== existing.priority) {
      rows.push({
        ...base,
        field: IssueActivityField.PRIORITY,
        fromValue: existing.priority,
        toValue: input.priority,
      });
    }

    if (input.status !== undefined && input.status !== existing.status) {
      rows.push({
        ...base,
        field: IssueActivityField.STATUS,
        fromValue: existing.status,
        toValue: input.status,
      });
    }

    if (
      input.assigneeId !== undefined &&
      input.assigneeId !== existing.assigneeId
    ) {
      rows.push({
        ...base,
        field: IssueActivityField.ASSIGNEE,
        fromValue: existing.assigneeId,
        toValue: input.assigneeId,
      });
    }

    return rows;
  }
}

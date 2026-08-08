import { Injectable } from "@nestjs/common";
import type {
  IssueResponseWire,
  IssueSummaryResponseWire,
} from "@rivet/shared/api";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import { z, ZodError } from "zod";

import { DomainError, ValidationError } from "@/common/errors";
import { Helpers } from "@/common/helpers";
import { TenantContextService } from "@/common/services";
import type { PaginatedResult } from "@/common/types";
import { DatabaseService } from "@/database/database.service";
import { Issue } from "@/generated/prisma/client";
import { IssueService as IssueModuleService } from "@/modules/issue/issue.service";
import { ProjectService as ProjectModuleService } from "@/modules/project/project.service";

import {
  CreateIssueInput,
  GetIssueSummaryInput,
  ListIssuesInput,
  UpdateIssueInput,
} from "./issue.types";

const IssuesListCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
});

@Injectable()
export class IssueService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly issueService: IssueModuleService,
    private readonly projectService: ProjectModuleService,
    private readonly tenantContext: TenantContextService
  ) {}

  async createIssue(input: CreateIssueInput): Promise<IssueResponseWire> {
    const organizationId = this.tenantContext.orgId;

    const { issue, projectKey } =
      await this.databaseService.client.$transaction(async (tx) => {
        const options = { tx };

        const project = await this.projectService.getActiveById(
          { id: input.projectId },
          options
        );

        const number = await this.projectService.allocateNextIssueNumber(
          project.id,
          options
        );

        const created = await this.issueService.create(
          {
            description: input.description,
            number,
            organizationId,
            priority: input.priority,
            projectId: project.id,
            status: input.status,
            title: input.title,
          },
          options
        );

        return { issue: created, projectKey: project.key };
      });

    return this.toResponse(issue, projectKey);
  }

  async getIssue(id: string): Promise<IssueResponseWire> {
    const issue = await this.issueService.findById({ id });

    if (!issue) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    const project = await this.projectService.findById({
      id: issue.projectId,
    });

    if (!project) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return this.toResponse(issue, project.key);
  }

  async listIssues(
    input: ListIssuesInput
  ): Promise<PaginatedResult<IssueResponseWire>> {
    const project = await this.projectService.findById({
      id: input.projectId,
    });

    if (!project) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    const after = this.decodeCursor(input.pagination.cursor);

    const result = await this.issueService.list({
      after: after
        ? {
            createdAt: new Date(after.createdAt),
            id: after.id,
          }
        : undefined,
      limit: input.pagination.limit,
      priority: input.priority,
      projectId: input.projectId,
      status: input.status,
    });

    return Helpers.toCursorPaginatedResult(
      {
        items: result.items.map((issue) => this.toResponse(issue, project.key)),
        nextCursor: result.next
          ? Helpers.encodePaginationCursor({
              createdAt: result.next.createdAt.toISOString(),
              id: result.next.id,
            })
          : null,
      },
      input.pagination
    );
  }

  async getIssueSummary(
    input: GetIssueSummaryInput
  ): Promise<IssueSummaryResponseWire> {
    const project = await this.projectService.findById({
      id: input.projectId,
    });

    if (!project) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return this.issueService.summarize({ projectId: input.projectId });
  }

  async updateIssue(input: UpdateIssueInput): Promise<IssueResponseWire> {
    const existing = await this.issueService.findById({ id: input.id });

    if (!existing) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    const project = await this.projectService.getActiveById({
      id: existing.projectId,
    });

    const issue = await this.issueService.update(input.id, {
      description: input.description,
      priority: input.priority,
      status: input.status,
      title: input.title,
    });

    if (!issue) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return this.toResponse(issue, project.key);
  }

  private decodeCursor(cursor: string | undefined) {
    if (!cursor) {
      return undefined;
    }

    try {
      return Helpers.decodePaginationCursor(cursor, IssuesListCursorSchema);
    } catch (err) {
      if (err instanceof ZodError || err instanceof SyntaxError) {
        throw new ValidationError({
          cursor: [{ message: "Invalid cursor" }],
        });
      }
      throw err;
    }
  }

  private toResponse(issue: Issue, projectKey: string): IssueResponseWire {
    return {
      createdAt: issue.createdAt.toISOString(),
      description: issue.description,
      id: issue.id,
      number: issue.number,
      priority: issue.priority as IssueResponseWire["priority"],
      projectId: issue.projectId,
      projectKey,
      status: issue.status as IssueResponseWire["status"],
      title: issue.title,
      updatedAt: issue.updatedAt.toISOString(),
    };
  }
}

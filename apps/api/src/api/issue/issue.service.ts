import { Injectable } from "@nestjs/common";
import type {
  IssueAssigneeWire,
  IssueProjectWire,
  IssueResponseWire,
  IssueSummaryResponseWire,
} from "@rivet/shared/api";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import { ZodError } from "zod";

import { DomainError, ValidationError } from "@/common/errors";
import { Helpers } from "@/common/helpers";
import { TenantContextService } from "@/common/services";
import type { PaginatedResult } from "@/common/types";
import { DatabaseService } from "@/database/database.service";
import type { DbOptions } from "@/database/database.types";
import { Project } from "@/generated/prisma/client";
import { IssueService as IssueModuleService } from "@/modules/issue/issue.service";
import type { IssueWithAssignee } from "@/modules/issue/issue.types";
import { OrgMemberService } from "@/modules/org-member/org-member.service";
import { ProjectService as ProjectModuleService } from "@/modules/project/project.service";

import { IssuesListCursorSchema } from "./issue.constants";
import {
  CreateIssueInput,
  GetIssueSummaryInput,
  ListIssuesInput,
  UpdateIssueInput,
} from "./issue.types";

@Injectable()
export class IssueService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly issueService: IssueModuleService,
    private readonly orgMemberService: OrgMemberService,
    private readonly projectService: ProjectModuleService,
    private readonly tenantContext: TenantContextService
  ) {}

  async createIssue(input: CreateIssueInput): Promise<IssueResponseWire> {
    const organizationId = this.tenantContext.orgId;

    const { issue, project } = await this.databaseService.client.$transaction(
      async (tx) => {
        const options = { tx };

        const project = await this.projectService.getActiveById(
          { id: input.projectId },
          options
        );

        if (input.assigneeId) {
          await this.assertAssigneeIsOrgMember(input.assigneeId, options);
        }

        const number = await this.projectService.allocateNextIssueNumber(
          project.id,
          options
        );

        const created = await this.issueService.create(
          {
            assigneeId: input.assigneeId,
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

        return { issue: created, project };
      }
    );

    return this.toResponse(issue, project);
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

    return this.toResponse(issue, project);
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
    const assigneeId = this.resolveAssigneeFilter(input.assigneeId);

    const result = await this.issueService.list({
      after: after
        ? {
            createdAt: new Date(after.createdAt),
            id: after.id,
          }
        : undefined,
      assigneeId,
      limit: input.pagination.limit,
      priority: input.priority,
      projectId: input.projectId,
      status: input.status,
    });

    return Helpers.toCursorPaginatedResult(
      {
        items: result.items.map((issue) => this.toResponse(issue, project)),
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

    if (input.assigneeId) {
      await this.assertAssigneeIsOrgMember(input.assigneeId);
    }

    const issue = await this.issueService.update(input.id, {
      assigneeId: input.assigneeId,
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

    return this.toResponse(issue, project);
  }

  private resolveAssigneeFilter(
    assigneeId: ListIssuesInput["assigneeId"]
  ): string | null | undefined {
    if (assigneeId === undefined) {
      return undefined;
    }

    if (assigneeId === "unassigned") {
      return null;
    }

    if (assigneeId === "me") {
      return this.tenantContext.userId;
    }

    return assigneeId;
  }

  private async assertAssigneeIsOrgMember(
    assigneeId: string,
    options?: DbOptions
  ): Promise<void> {
    const membership = await this.orgMemberService.findByOrgAndUser(
      {
        orgId: this.tenantContext.orgId,
        userId: assigneeId,
      },
      options
    );

    if (!membership) {
      throw new DomainError(
        "RULE_VIOLATION",
        ErrorCode.ASSIGNEE_NOT_ORG_MEMBER,
        ErrorMessage.ASSIGNEE_NOT_ORG_MEMBER
      );
    }
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

  private toResponse(
    issue: IssueWithAssignee,
    project: Pick<Project, "id" | "key" | "name">
  ): IssueResponseWire {
    return {
      assignee: this.toAssignee(issue.assignee),
      createdAt: issue.createdAt.toISOString(),
      description: issue.description,
      id: issue.id,
      number: issue.number,
      priority: issue.priority as IssueResponseWire["priority"],
      project: this.toProject(project),
      status: issue.status as IssueResponseWire["status"],
      title: issue.title,
      updatedAt: issue.updatedAt.toISOString(),
    };
  }

  private toAssignee(
    assignee: IssueWithAssignee["assignee"]
  ): IssueAssigneeWire | null {
    if (!assignee) {
      return null;
    }

    return {
      firstName: assignee.firstName,
      id: assignee.id,
      lastName: assignee.lastName,
    };
  }

  private toProject(
    project: Pick<Project, "id" | "key" | "name">
  ): IssueProjectWire {
    return {
      id: project.id,
      key: project.key,
      name: project.name,
    };
  }
}

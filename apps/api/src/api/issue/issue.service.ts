import { Injectable } from "@nestjs/common";
import type {
  IssueActivityActorWire,
  IssueActivityResponseWire,
  IssueAssigneeWire,
  IssueCommentAuthorWire,
  IssueCommentResponseWire,
  IssueConflictDetailsWire,
  IssueProjectWire,
  IssueResponseWire,
  IssueSummaryResponseWire,
} from "@rivet/shared/api";
import {
  ErrorCode,
  ErrorMessage,
  hasMinOrgRole,
  IssueStatus as SharedIssueStatus,
  OrganizationRole,
} from "@rivet/shared/enums";
import { ZodError } from "zod";

import { DomainError, ValidationError } from "@/common/errors";
import { Helpers } from "@/common/helpers";
import { HashService, TenantContextService } from "@/common/services";
import type { PaginatedResult } from "@/common/types";
import { DatabaseService } from "@/database/database.service";
import type { DbOptions } from "@/database/database.types";
import { Project } from "@/generated/prisma/client";
import { IssueService as IssueModuleService } from "@/modules/issue/issue.service";
import type {
  IssueActivityWithActor,
  IssueCommentWithAuthor,
  IssueWithAssignee,
  UpdateIssueCurrent,
} from "@/modules/issue/issue.types";
import { OrgMemberService } from "@/modules/org-member/org-member.service";
import { ProjectService as ProjectModuleService } from "@/modules/project/project.service";

import {
  COMMENT_RATE_LIMIT_MAX,
  COMMENT_RATE_LIMIT_WINDOW_MS,
  IssuesListCursorSchema,
} from "./issue.constants";
import {
  CreateIssueCommentInput,
  CreateIssueInput,
  DeleteIssueCommentInput,
  GetIssueSummaryInput,
  ListIssueActivityInput,
  ListIssueCommentsInput,
  ListIssuesInput,
  UpdateIssueCommentInput,
  UpdateIssueInput,
} from "./issue.types";

@Injectable()
export class IssueService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly hashService: HashService,
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
    const issue = await this.issueService.getById({ id });

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
    const existing = await this.issueService.getById({ id: input.id });
    const project = await this.projectService.getActiveById({
      id: existing.projectId,
    });

    if (input.assigneeId) {
      await this.assertAssigneeIsOrgMember(input.assigneeId);
    }

    const conflicts = this.conflicts(existing, input);

    if (conflicts) {
      throw new DomainError(
        "CONFLICT",
        ErrorCode.ISSUE_CONFLICT,
        ErrorMessage.ISSUE_CONFLICT,
        conflicts
      );
    }

    const current = this.casCurrent(existing, input);
    const patch = {
      actorId: this.tenantContext.userId,
      assigneeId: input.assigneeId,
      description: input.description,
      id: input.id,
      priority: input.priority,
      status: input.status,
      title: input.title,
    };
    const issue = current
      ? await this.issueService.updateIfCurrent({ ...patch, current })
      : await this.issueService.update(patch);

    // CAS lost the race: another writer changed a pinned field after our pre-check.
    if (!issue) {
      const latest = await this.issueService.getById({ id: input.id });
      throw new DomainError(
        "CONFLICT",
        ErrorCode.ISSUE_CONFLICT,
        ErrorMessage.ISSUE_CONFLICT,
        // Prefer fields that are still stale. Snapshot if they already match again
        // (the other writer changed a field and changed it back).
        this.conflicts(latest, input) ?? this.conflictSnapshot(latest, input)
      );
    }

    return this.toResponse(issue, project);
  }

  async deleteIssue(id: string): Promise<IssueResponseWire> {
    const issue = await this.issueService.getById({ id });
    const project = await this.projectService.getActiveById({
      id: issue.projectId,
    });

    await this.issueService.delete({ id: issue.id });

    return this.toResponse(issue, project);
  }

  async listActivity(
    input: ListIssueActivityInput
  ): Promise<PaginatedResult<IssueActivityResponseWire>> {
    await this.issueService.getById({ id: input.issueId });

    const after = this.decodeCursor(input.pagination.cursor);

    const result = await this.issueService.listActivity({
      after: after
        ? {
            createdAt: new Date(after.createdAt),
            id: after.id,
          }
        : undefined,
      issueId: input.issueId,
      limit: input.pagination.limit,
    });

    return Helpers.toCursorPaginatedResult(
      {
        items: result.items.map((activity) =>
          this.toActivityResponse(activity)
        ),
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

  async createComment(
    input: CreateIssueCommentInput
  ): Promise<IssueCommentResponseWire> {
    const issue = await this.issueService.getById({ id: input.issueId });
    await this.projectService.getActiveById({ id: issue.projectId });
    await this.assertCommentRateLimit();

    const comment = await this.issueService.createComment({
      authorId: this.tenantContext.userId,
      body: input.body,
      issueId: issue.id,
      organizationId: this.tenantContext.orgId,
    });

    return this.toCommentResponse(comment);
  }

  async listComments(
    input: ListIssueCommentsInput
  ): Promise<PaginatedResult<IssueCommentResponseWire>> {
    await this.issueService.getById({ id: input.issueId });

    const after = this.decodeCursor(input.pagination.cursor);

    const result = await this.issueService.listComments({
      after: after
        ? {
            createdAt: new Date(after.createdAt),
            id: after.id,
          }
        : undefined,
      issueId: input.issueId,
      limit: input.pagination.limit,
    });

    return Helpers.toCursorPaginatedResult(
      {
        items: result.items.map((comment) => this.toCommentResponse(comment)),
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

  async updateComment(
    input: UpdateIssueCommentInput
  ): Promise<IssueCommentResponseWire> {
    const issue = await this.issueService.getById({ id: input.issueId });
    await this.projectService.getActiveById({ id: issue.projectId });

    const existing = await this.issueService.getCommentById({
      id: input.commentId,
      issueId: issue.id,
    });
    this.assertCanMutateComment(existing);

    const comment = await this.issueService.updateComment({
      body: input.body,
      id: input.commentId,
      issueId: issue.id,
    });

    return this.toCommentResponse(comment);
  }

  async deleteComment(
    input: DeleteIssueCommentInput
  ): Promise<IssueCommentResponseWire> {
    const issue = await this.issueService.getById({ id: input.issueId });
    await this.projectService.getActiveById({ id: issue.projectId });

    const existing = await this.issueService.getCommentById({
      id: input.commentId,
      issueId: issue.id,
    });
    this.assertCanMutateComment(existing);

    const comment = await this.issueService.deleteComment({
      id: input.commentId,
      issueId: issue.id,
    });

    return this.toCommentResponse(comment);
  }

  private async assertCommentRateLimit(): Promise<void> {
    const createdAtGte = new Date(Date.now() - COMMENT_RATE_LIMIT_WINDOW_MS);
    const recentCount = await this.issueService.countCommentsByAuthorSince({
      authorId: this.tenantContext.userId,
      createdAtGte,
    });

    if (recentCount >= COMMENT_RATE_LIMIT_MAX) {
      throw new DomainError(
        "TOO_MANY_REQUESTS",
        ErrorCode.COMMENT_RATE_LIMIT_EXCEEDED,
        ErrorMessage.COMMENT_RATE_LIMIT_EXCEEDED
      );
    }
  }

  private assertCanMutateComment(comment: IssueCommentWithAuthor): void {
    if (comment.authorId === this.tenantContext.userId) {
      return;
    }

    if (
      hasMinOrgRole(
        this.tenantContext.orgRole as OrganizationRole,
        OrganizationRole.ADMIN
      )
    ) {
      return;
    }

    throw new DomainError(
      "FORBIDDEN",
      ErrorCode.FORBIDDEN,
      ErrorMessage.FORBIDDEN
    );
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

  /** Current values for patched high-risk fields whose expected* no longer match. */
  private conflicts(
    issue: IssueWithAssignee,
    input: UpdateIssueInput
  ): IssueConflictDetailsWire | null {
    const conflicts: IssueConflictDetailsWire["conflicts"] = {};

    if (
      input.status !== undefined &&
      input.expectedStatus !== (issue.status as SharedIssueStatus)
    ) {
      conflicts.status = { current: issue.status as SharedIssueStatus };
    }

    if (
      input.assigneeId !== undefined &&
      input.expectedAssigneeId !== issue.assigneeId
    ) {
      conflicts.assigneeId = { current: issue.assigneeId };
    }

    if (
      input.description !== undefined &&
      (input.expectedDescriptionHash === undefined ||
        !this.hashService.verifyFingerprint(
          issue.description,
          input.expectedDescriptionHash
        ))
    ) {
      conflicts.description = {
        current: issue.description,
        descriptionHash: this.hashService.fingerprint(issue.description),
      };
    }

    if (
      conflicts.assigneeId === undefined &&
      conflicts.description === undefined &&
      conflicts.status === undefined
    ) {
      return null;
    }

    return { conflicts };
  }

  /** Current values for every patched high-risk field, whether stale or not. */
  private conflictSnapshot(
    issue: IssueWithAssignee,
    input: UpdateIssueInput
  ): IssueConflictDetailsWire {
    const conflicts: IssueConflictDetailsWire["conflicts"] = {};

    if (input.status !== undefined) {
      conflicts.status = { current: issue.status as SharedIssueStatus };
    }

    if (input.assigneeId !== undefined) {
      conflicts.assigneeId = { current: issue.assigneeId };
    }

    if (input.description !== undefined) {
      conflicts.description = {
        current: issue.description,
        descriptionHash: this.hashService.fingerprint(issue.description),
      };
    }

    return { conflicts };
  }

  /** Values to pin in the UPDATE WHERE for high-risk fields in this PATCH. */
  private casCurrent(
    issue: IssueWithAssignee,
    input: UpdateIssueInput
  ): UpdateIssueCurrent | undefined {
    const current: UpdateIssueCurrent = {
      ...(input.assigneeId !== undefined
        ? { assigneeId: issue.assigneeId }
        : {}),
      ...(input.description !== undefined
        ? { description: issue.description }
        : {}),
      ...(input.status !== undefined ? { status: issue.status } : {}),
    };

    if (
      current.assigneeId === undefined &&
      current.description === undefined &&
      current.status === undefined
    ) {
      return undefined;
    }

    return current;
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
      descriptionHash: this.hashService.fingerprint(issue.description),
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

  private toCommentResponse(
    comment: IssueCommentWithAuthor
  ): IssueCommentResponseWire {
    return {
      author: this.toCommentAuthor(comment.author),
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      id: comment.id,
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  private toCommentAuthor(
    author: IssueCommentWithAuthor["author"]
  ): IssueCommentAuthorWire | null {
    if (!author) {
      return null;
    }

    return {
      firstName: author.firstName,
      id: author.id,
      lastName: author.lastName,
    };
  }

  private toActivityResponse(
    activity: IssueActivityWithActor
  ): IssueActivityResponseWire {
    return {
      actor: this.toActivityActor(activity.actor),
      createdAt: activity.createdAt.toISOString(),
      field: activity.field as IssueActivityResponseWire["field"],
      fromValue: activity.fromValue,
      id: activity.id,
      toValue: activity.toValue,
    };
  }

  private toActivityActor(
    actor: IssueActivityWithActor["actor"]
  ): IssueActivityActorWire | null {
    if (!actor) {
      return null;
    }

    return {
      firstName: actor.firstName,
      id: actor.id,
      lastName: actor.lastName,
    };
  }
}

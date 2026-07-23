import {
  DEFAULT_REACTIONS,
  type Issue,
  type IssueActivityEvent,
  type IssueComment,
  memberByName,
  type TeamMember,
} from "./issue-types";

/** Shared issue detail mutation helpers for list/detail state. */
export function applyIssueCommentAdd(
  issue: Issue,
  body: string,
  currentUser: string,
  teamMembers: TeamMember[],
  options?: { id?: string; syncStatus?: IssueComment["syncStatus"] }
): Issue {
  const member = memberByName(teamMembers, currentUser);
  const comment: IssueComment = {
    id: options?.id ?? crypto.randomUUID(),
    author: currentUser,
    authorInitials: member?.initials ?? "??",
    body,
    createdAt: new Date(),
    reactions: DEFAULT_REACTIONS.map((emoji) => ({
      emoji,
      count: 0,
      reactedByMe: false,
    })),
    syncStatus: options?.syncStatus,
  };
  const comments = [...issue.comments, comment];
  return {
    ...issue,
    comments,
    commentCount: comments.length,
    updatedAt: new Date(),
  };
}

export function applyIssueActivityAdd(
  issue: Issue,
  event: IssueActivityEvent
): Issue {
  return {
    ...issue,
    activity: [...issue.activity, event],
    updatedAt: new Date(),
  };
}

export function applyIssueCommentEdit(
  issue: Issue,
  commentId: string,
  body: string
): Issue {
  return {
    ...issue,
    comments: issue.comments.map((c) =>
      c.id === commentId ? { ...c, body } : c
    ),
    updatedAt: new Date(),
  };
}

export function applyIssueCommentDelete(
  issue: Issue,
  commentId: string
): Issue {
  const comments = issue.comments.filter((c) => c.id !== commentId);
  return {
    ...issue,
    comments,
    commentCount: comments.length,
    updatedAt: new Date(),
  };
}

export function applyIssueReactionToggle(
  issue: Issue,
  commentId: string,
  emoji: string
): Issue {
  return {
    ...issue,
    comments: issue.comments.map((comment) => {
      if (comment.id !== commentId) return comment;
      const reactions = comment.reactions.map((reaction) => {
        if (reaction.emoji !== emoji) return reaction;
        if (reaction.reactedByMe) {
          return {
            ...reaction,
            count: Math.max(0, reaction.count - 1),
            reactedByMe: false,
          };
        }
        return {
          ...reaction,
          count: reaction.count + 1,
          reactedByMe: true,
        };
      });
      return { ...comment, reactions };
    }),
  };
}

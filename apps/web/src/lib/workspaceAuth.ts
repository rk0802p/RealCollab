import { prisma, WorkspaceRole, hasPermission, RolePermissions } from '@realcollab/shared';

export interface MembershipContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

/**
 * Validates that the user is a member of the workspace and returns their role.
 */
export async function getWorkspaceMembership(
  workspaceId: string,
  userId: string
): Promise<MembershipContext | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!member) return null;

  return {
    userId,
    workspaceId,
    role: member.role,
  };
}

/**
 * Requires the user to have a specific permission in the workspace.
 */
export async function requireWorkspacePermission(
  workspaceId: string,
  userId: string,
  permission: keyof RolePermissions
): Promise<MembershipContext> {
  const membership = await getWorkspaceMembership(workspaceId, userId);
  if (!membership) {
    throw new Error('NOT_A_WORKSPACE_MEMBER');
  }

  if (!hasPermission(membership.role, permission)) {
    throw new Error('FORBIDDEN');
  }

  return membership;
}

/**
 * Validates that the user has access to a specific page via its workspace membership.
 */
export async function getPageAccess(pageId: string, userId: string) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      workspace: true,
    },
  });

  if (!page) {
    throw new Error('PAGE_NOT_FOUND');
  }

  const membership = await getWorkspaceMembership(page.workspaceId, userId);
  if (!membership) {
    throw new Error('NOT_A_WORKSPACE_MEMBER');
  }

  return {
    page,
    membership,
  };
}

/**
 * Validates that the user has access to a specific comment via its page workspace membership.
 */
export async function getCommentAccess(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      page: {
        include: {
          workspace: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!comment) {
    throw new Error('COMMENT_NOT_FOUND');
  }

  const membership = await getWorkspaceMembership(comment.page.workspaceId, userId);
  if (!membership) {
    throw new Error('NOT_A_WORKSPACE_MEMBER');
  }

  return {
    comment,
    membership,
  };
}

/**
 * Validates that the user has access to a specific document snapshot via its page workspace membership.
 */
export async function getSnapshotAccess(snapshotId: string, userId: string) {
  const snapshot = await prisma.documentSnapshot.findUnique({
    where: { id: snapshotId },
    include: {
      page: {
        include: {
          workspace: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!snapshot) {
    throw new Error('SNAPSHOT_NOT_FOUND');
  }

  const membership = await getWorkspaceMembership(snapshot.page.workspaceId, userId);
  if (!membership) {
    throw new Error('NOT_A_WORKSPACE_MEMBER');
  }

  return {
    snapshot,
    membership,
  };
}

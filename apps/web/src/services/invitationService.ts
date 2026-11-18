import crypto from 'crypto';
import { prisma, WorkspaceRole } from '@realcollab/shared';

export interface CreateInvitationParams {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  inviterId: string;
  expiresInDays?: number;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a cryptographically secure workspace invitation.
 */
export async function createInvitation({
  workspaceId,
  email,
  role,
  inviterId,
  expiresInDays = 7,
}: CreateInvitationParams) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if invited user is already a member of this workspace
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const isMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: existingUser.id,
        },
      },
    });

    if (isMember) {
      throw new Error('ALREADY_A_MEMBER');
    }
  }

  // Generate random token and hash
  const rawToken = generateInvitationToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // Remove existing pending invitations for this email in this workspace
  await prisma.invitation.deleteMany({
    where: {
      workspaceId,
      email: normalizedEmail,
    },
  });

  const invitation = await prisma.invitation.create({
    data: {
      workspaceId,
      email: normalizedEmail,
      role,
      tokenHash,
      inviterId,
      expiresAt,
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    invitation,
    rawToken,
  };
}

/**
 * Lists all active invitations for a workspace.
 */
export async function listPendingInvitations(workspaceId: string) {
  const now = new Date();
  return prisma.invitation.findMany({
    where: {
      workspaceId,
      expiresAt: {
        gt: now,
      },
    },
    include: {
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Revokes / deletes an invitation.
 */
export async function revokeInvitation(invitationId: string, workspaceId: string) {
  const deleted = await prisma.invitation.deleteMany({
    where: {
      id: invitationId,
      workspaceId,
    },
  });
  return deleted.count > 0;
}

/**
 * Resolves invitation details by raw secret token (for preview / accept screen).
 */
export async function getInvitationByToken(rawToken: string) {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = hashToken(rawToken);
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!invitation) return null;

  const isExpired = invitation.expiresAt.getTime() < Date.now();
  return {
    ...invitation,
    isExpired,
  };
}

/**
 * Accepts an invitation and joins the workspace.
 */
export async function acceptInvitation(rawToken: string, userId: string) {
  const inviteData = await getInvitationByToken(rawToken);
  if (!inviteData) {
    throw new Error('INVITATION_NOT_FOUND');
  }

  if (inviteData.isExpired) {
    throw new Error('INVITATION_EXPIRED');
  }

  // Add user to workspace with the specified role
  const membership = await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: inviteData.workspaceId,
        userId,
      },
    },
    create: {
      workspaceId: inviteData.workspaceId,
      userId,
      role: inviteData.role,
    },
    update: {
      role: inviteData.role,
    },
    include: {
      workspace: true,
    },
  });

  // Delete consumed invitation
  await prisma.invitation.delete({
    where: { id: inviteData.id },
  });

  return {
    membership,
    workspace: inviteData.workspace,
    role: inviteData.role,
  };
}

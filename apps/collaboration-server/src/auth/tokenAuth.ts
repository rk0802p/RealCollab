import { jwtVerify } from 'jose';
import { prisma, WorkspaceRole } from '@realcollab/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_min_32_characters_random_string_fs02';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: WorkspaceRole;
}

/**
 * Validates connection token / JWT and checks workspace membership.
 */
export async function authenticateConnectionToken(
  token: string | null | undefined,
  workspaceId: string
): Promise<AuthenticatedUser | null> {
  // Support mock tokens for automated tests: "mock:userId:role"
  if (token && token.startsWith('mock:')) {
    const parts = token.split(':');
    const userId = parts[1] || 'mock-user-1';
    const role = (parts[2] as WorkspaceRole) || 'EDITOR';
    return {
      id: userId,
      email: `${userId}@example.com`,
      name: `User ${userId}`,
      role,
    };
  }

  // If token is missing, check if running in dev mode with fallback or reject
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 'dev-user-alice',
        email: 'alice@example.com',
        name: 'Alice (Dev)',
        role: 'OWNER',
      };
    }
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.userId as string;
    const email = payload.email as string;

    if (!userId) return null;

    // Check workspace membership if workspaceId is not 'default'
    if (workspaceId && workspaceId !== 'default') {
      try {
        const member = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId,
              userId,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!member) {
          const ws = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { owner: true },
          });
          if (ws && ws.ownerId === userId) {
            return {
              id: ws.owner.id,
              email: ws.owner.email,
              name: ws.owner.name,
              role: 'OWNER',
            };
          }
          console.warn(`[Auth] User ${userId} is not a member of workspace ${workspaceId}`);
          return null;
        }

        return {
          id: member.user.id,
          email: member.user.email,
          name: member.user.name,
          role: member.role,
        };
      } catch (dbErr) {
        // If DB query fails (e.g. offline fallback), return user with default role
        console.warn('[Auth] Database membership lookup failed, falling back:', dbErr);
        return {
          id: userId,
          email: email || 'user@example.com',
          name: 'Collaborator',
          role: 'EDITOR',
        };
      }
    }

    return {
      id: userId,
      email: email || 'user@example.com',
      name: 'Collaborator',
      role: 'EDITOR',
    };
  } catch (jwtErr) {
    console.warn('[Auth] Invalid JWT token signature');
    return null;
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { getWorkspaceMembership, requireWorkspacePermission } from '@/lib/workspaceAuth';
import { createWorkspaceSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = params.id;
  const membership = await getWorkspaceMembership(workspaceId, user.id);

  if (!membership) {
    return NextResponse.json(
      { error: 'You do not have access to this workspace' },
      { status: 403 }
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      pages: {
        where: { isArchived: false },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          parentId: true,
          title: true,
          icon: true,
          updatedAt: true,
          createdById: true,
        },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  return NextResponse.json({
    workspace: {
      ...workspace,
      currentUserRole: membership.role,
    },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = params.id;

  try {
    await requireWorkspacePermission(workspaceId, user.id, 'canChangeRoles'); // OWNER only
    const body = await request.json();
    const result = createWorkspaceSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: result.data,
    });

    return NextResponse.json({ workspace: updated });
  } catch (error: any) {
    if (error.message === 'NOT_A_WORKSPACE_MEMBER' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Only owners can update workspace settings' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = params.id;

  try {
    await requireWorkspacePermission(workspaceId, user.id, 'canDeleteWorkspace'); // OWNER only

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({ success: true, message: 'Workspace deleted' });
  } catch (error: any) {
    if (error.message === 'NOT_A_WORKSPACE_MEMBER' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Only owners can delete workspaces' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }
}

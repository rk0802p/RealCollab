import { NextResponse } from 'next/server';
import { prisma } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { requireWorkspacePermission } from '@/lib/workspaceAuth';
import { updateRoleSchema } from '@/lib/validations';

interface RouteContext {
  params: { id: string; memberId: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: workspaceId, memberId } = params;

  try {
    // Only OWNER can change roles
    await requireWorkspacePermission(workspaceId, user.id, 'canChangeRoles');

    const body = await request.json();
    const result = updateRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid role', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { role } = result.data;

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
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
    });

    return NextResponse.json({ member: updated });
  } catch (error: any) {
    if (error.message === 'NOT_A_WORKSPACE_MEMBER' || error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Only workspace owners can change member roles' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: workspaceId, memberId } = params;

  try {
    // Only OWNER can remove members
    await requireWorkspacePermission(workspaceId, user.id, 'canChangeRoles');

    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.userId === user.id) {
      return NextResponse.json(
        { error: 'Workspace owner cannot remove themselves' },
        { status: 400 }
      );
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true, message: 'Member removed' });
  } catch (error: any) {
    if (error.message === 'NOT_A_WORKSPACE_MEMBER' || error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Only workspace owners can remove members' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}

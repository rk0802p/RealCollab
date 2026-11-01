import { NextResponse } from 'next/server';
import { prisma } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { requireWorkspacePermission } from '@/lib/workspaceAuth';
import { addMemberSchema } from '@/lib/validations';

interface RouteContext {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = params.id;

  try {
    // Only OWNER can invite members
    await requireWorkspacePermission(workspaceId, user.id, 'canInviteMembers');

    const body = await request.json();
    const result = addMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find the target user to add
    const targetUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User with this email is not registered yet' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 409 }
      );
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role,
      },
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

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'NOT_A_WORKSPACE_MEMBER' || error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Only workspace owners can invite new members' },
        { status: 403 }
      );
    }
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

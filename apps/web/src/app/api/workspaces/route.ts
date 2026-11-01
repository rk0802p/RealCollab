import { NextResponse } from 'next/server';
import { prisma } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { createWorkspaceSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              members: true,
              pages: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    description: m.workspace.description,
    ownerId: m.workspace.ownerId,
    role: m.role,
    memberCount: m.workspace._count.members,
    pageCount: m.workspace._count.pages,
    createdAt: m.workspace.createdAt,
  }));

  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createWorkspaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description } = result.data;

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name,
          description,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });

      // Create an initial page
      await tx.page.create({
        data: {
          workspaceId: ws.id,
          title: 'Welcome to ' + name,
          icon: '✨',
          createdById: user.id,
        },
      });

      return ws;
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}

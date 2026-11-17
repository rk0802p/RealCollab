import { NextResponse } from 'next/server';
import { prisma, hasPermission } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { getPageAccess } from '@/lib/workspaceAuth';
import { createCommentSchema } from '@/lib/validations';

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageId = params.id;

  try {
    const { membership } = await getPageAccess(pageId, user.id);

    if (!hasPermission(membership.role, 'canViewPages')) {
      return NextResponse.json(
        { error: 'You do not have permission to view this document' },
        { status: 403 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { pageId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
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
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    if (error.message === 'PAGE_NOT_FOUND') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    if (error.message === 'NOT_A_WORKSPACE_MEMBER') {
      return NextResponse.json(
        { error: 'You do not have permission to view this workspace' },
        { status: 403 }
      );
    }
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageId = params.id;

  try {
    const { membership } = await getPageAccess(pageId, user.id);

    // Enforce RBAC: only OWNER, EDITOR, COMMENTER can add comments (VIEWER cannot)
    if (!hasPermission(membership.role, 'canAddComments')) {
      return NextResponse.json(
        { error: 'Viewers are not permitted to add comments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        pageId,
        authorId: user.id,
        content: result.data.content,
        anchorData: result.data.anchorData || undefined,
        resolved: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
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
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'PAGE_NOT_FOUND') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    if (error.message === 'NOT_A_WORKSPACE_MEMBER') {
      return NextResponse.json(
        { error: 'You do not have permission to access this document' },
        { status: 403 }
      );
    }
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

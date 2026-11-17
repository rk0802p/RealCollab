import { NextResponse } from 'next/server';
import { prisma, hasPermission } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { getCommentAccess } from '@/lib/workspaceAuth';
import { resolveCommentSchema } from '@/lib/validations';

interface RouteContext {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { comment, membership } = await getCommentAccess(params.id, user.id);

    // Enforce RBAC: only OWNER, EDITOR, COMMENTER can resolve/reopen comments (VIEWER cannot)
    if (!hasPermission(membership.role, 'canResolveComments')) {
      return NextResponse.json(
        { error: 'Viewers are not permitted to resolve comments' },
        { status: 403 }
      );
    }

    let targetResolvedState = !comment.resolved;

    try {
      const body = await request.json();
      const result = resolveCommentSchema.safeParse(body);
      if (result.success && result.data.resolved !== undefined) {
        targetResolvedState = result.data.resolved;
      }
    } catch {
      // Body may be empty, which simply toggles resolved
    }

    const updated = await prisma.comment.update({
      where: { id: comment.id },
      data: { resolved: targetResolvedState },
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
    });

    return NextResponse.json({ comment: updated });
  } catch (error: any) {
    if (error.message === 'COMMENT_NOT_FOUND') {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    if (error.message === 'NOT_A_WORKSPACE_MEMBER') {
      return NextResponse.json(
        { error: 'You do not have permission to access this document' },
        { status: 403 }
      );
    }
    console.error('Resolve comment error:', error);
    return NextResponse.json({ error: 'Failed to update resolve status' }, { status: 500 });
  }
}

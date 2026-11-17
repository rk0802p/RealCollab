import { NextResponse } from 'next/server';
import { prisma, hasPermission } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { getCommentAccess } from '@/lib/workspaceAuth';
import { updateCommentSchema } from '@/lib/validations';

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { comment, membership } = await getCommentAccess(params.id, user.id);

    if (!hasPermission(membership.role, 'canViewPages')) {
      return NextResponse.json(
        { error: 'You do not have permission to view this comment' },
        { status: 403 }
      );
    }

    return NextResponse.json({ comment });
  } catch (error: any) {
    if (error.message === 'COMMENT_NOT_FOUND') {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    if (error.message === 'NOT_A_WORKSPACE_MEMBER') {
      return NextResponse.json(
        { error: 'You do not have permission to access this workspace' },
        { status: 403 }
      );
    }
    console.error('Fetch comment error:', error);
    return NextResponse.json({ error: 'Failed to fetch comment' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { comment } = await getCommentAccess(params.id, user.id);

    // Only the author can edit comment content
    if (comment.authorId !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = updateCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.comment.update({
      where: { id: params.id },
      data: { content: result.data.content },
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
    console.error('Update comment error:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { comment, membership } = await getCommentAccess(params.id, user.id);

    // Author of comment or workspace OWNER can delete comment
    const isAuthor = comment.authorId === user.id;
    const isOwner = membership.role === 'OWNER';

    if (!isAuthor && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this comment' },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
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
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}

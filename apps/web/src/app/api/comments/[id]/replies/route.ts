import { NextResponse } from 'next/server';
import { prisma, hasPermission } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { getCommentAccess } from '@/lib/workspaceAuth';
import { createReplySchema } from '@/lib/validations';
import { sanitizeComment } from '@/lib/sanitize';

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

    // Enforce RBAC: only OWNER, EDITOR, COMMENTER can reply (VIEWER cannot)
    if (!hasPermission(membership.role, 'canAddComments')) {
      return NextResponse.json(
        { error: 'Viewers are not permitted to add replies' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createReplySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const sanitizedContent = sanitizeComment(result.data.content);

    const reply = await prisma.commentReply.create({
      data: {
        commentId: comment.id,
        authorId: user.id,
        content: sanitizedContent,
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
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
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
    console.error('Create reply error:', error);
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
  }
}

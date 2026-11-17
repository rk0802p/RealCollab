import { NextResponse } from 'next/server';
import { prisma } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { getPageAccess } from '@/lib/workspaceAuth';
import { updatePageSchema } from '@/lib/validations';
import { hasPermission } from '@realcollab/shared';

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
    const { page, membership } = await getPageAccess(pageId, user.id);

    return NextResponse.json({
      page,
      currentUserRole: membership.role,
      permissions: {
        canEdit: hasPermission(membership.role, 'canEditContent'),
        canComment: hasPermission(membership.role, 'canAddComments'),
      },
    });
  } catch (error: any) {
    if (error.message === 'PAGE_NOT_FOUND') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    if (error.message === 'NOT_A_WORKSPACE_MEMBER') {
      return NextResponse.json(
        { error: 'You do not have permission to view this document' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageId = params.id;

  try {
    const { page, membership } = await getPageAccess(pageId, user.id);

    // Only OWNER or EDITOR can edit page metadata
    if (!hasPermission(membership.role, 'canEditContent')) {
      return NextResponse.json(
        { error: 'Viewers and Commenters cannot edit document properties' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = updatePageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.page.update({
      where: { id: pageId },
      data: result.data,
    });

    return NextResponse.json({ page: updated });
  } catch (error: any) {
    if (error.message === 'PAGE_NOT_FOUND') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    if (error.message === 'NOT_A_WORKSPACE_MEMBER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageId = params.id;

  try {
    const { page, membership } = await getPageAccess(pageId, user.id);

    // Only OWNER or EDITOR can delete/archive pages
    if (!hasPermission(membership.role, 'canEditContent')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this page' },
        { status: 403 }
      );
    }

    // Soft delete / archive
    await prisma.page.update({
      where: { id: pageId },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true, message: 'Page archived' });
  } catch (error: any) {
    if (error.message === 'PAGE_NOT_FOUND') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    if (error.message === 'NOT_A_WORKSPACE_MEMBER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}

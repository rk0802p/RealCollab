import { NextResponse } from 'next/server';
import { prisma } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { requireWorkspacePermission } from '@/lib/workspaceAuth';
import { createPageSchema } from '@/lib/validations';
import { sanitizeTitle } from '@/lib/sanitize';

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
    // Requires canEditContent (OWNER or EDITOR)
    await requireWorkspacePermission(workspaceId, user.id, 'canEditContent');

    const body = await request.json();
    const result = createPageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { title, icon, parentId } = result.data;
    const sanitizedPageTitle = sanitizeTitle(title, 120, 'Untitled');

    // If parentId provided, verify parent exists in the same workspace
    if (parentId) {
      const parent = await prisma.page.findFirst({
        where: { id: parentId, workspaceId },
      });
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent page does not exist in this workspace' },
          { status: 400 }
        );
      }
    }

    const page = await prisma.page.create({
      data: {
        workspaceId,
        title: sanitizedPageTitle,
        icon: icon || '📝',
        parentId: parentId || null,
        createdById: user.id,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'NOT_A_WORKSPACE_MEMBER' || error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'You do not have permission to create pages in this workspace' },
        { status: 403 }
      );
    }
    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}

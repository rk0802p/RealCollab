import { NextResponse } from 'next/server';
import * as Y from 'yjs';
import { prisma, hasPermission } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { getPageAccess } from '@/lib/workspaceAuth';
import { createSnapshotSchema } from '@/lib/validations';

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
        { error: 'You do not have permission to view snapshots for this document' },
        { status: 403 }
      );
    }

    const rawSnapshots = await prisma.documentSnapshot.findMany({
      where: { pageId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const snapshots = rawSnapshots.map((s) => ({
      id: s.id,
      pageId: s.pageId,
      description: s.description || 'Snapshot checkpoint',
      createdAt: s.createdAt.toISOString(),
      createdById: s.createdById,
      sizeBytes: s.snapshotBytes.length,
      creator: s.creator,
    }));

    return NextResponse.json({ snapshots });
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
    console.error('Fetch snapshots error:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageId = params.id;

  try {
    const { page, membership } = await getPageAccess(pageId, user.id);

    // Enforce RBAC: only OWNER or EDITOR can create snapshot checkpoints
    if (!hasPermission(membership.role, 'canEditContent')) {
      return NextResponse.json(
        { error: 'Viewers and Commenters are not permitted to create snapshots' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = createSnapshotSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    let snapshotBuffer: Buffer;

    if (result.data.snapshotBase64) {
      snapshotBuffer = Buffer.from(result.data.snapshotBase64, 'base64');
    } else {
      // Reconstruct snapshot on the server using existing database state
      const tempDoc = new Y.Doc();

      const latestSnapshot = await prisma.documentSnapshot.findFirst({
        where: { pageId },
        orderBy: { createdAt: 'desc' },
      });

      if (latestSnapshot && latestSnapshot.snapshotBytes) {
        Y.applyUpdate(tempDoc, new Uint8Array(latestSnapshot.snapshotBytes));
      }

      const incrementalUpdates = await prisma.documentUpdate.findMany({
        where: {
          pageId,
          ...(latestSnapshot ? { createdAt: { gt: latestSnapshot.createdAt } } : {}),
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const updateRow of incrementalUpdates) {
        Y.applyUpdate(tempDoc, new Uint8Array(updateRow.updateBytes));
      }

      // If document is empty in updates, fallback to page.content
      const ytext = tempDoc.getText('default');
      if (ytext.length === 0 && page.content) {
        ytext.insert(0, page.content);
      }

      const encoded = Y.encodeStateAsUpdate(tempDoc);
      snapshotBuffer = Buffer.from(encoded);
      tempDoc.destroy();
    }

    const snapshot = await prisma.documentSnapshot.create({
      data: {
        pageId,
        createdById: user.id,
        description: result.data.description || 'Manual named checkpoint',
        snapshotBytes: snapshotBuffer,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        snapshot: {
          id: snapshot.id,
          pageId: snapshot.pageId,
          description: snapshot.description,
          createdAt: snapshot.createdAt.toISOString(),
          createdById: snapshot.createdById,
          sizeBytes: snapshot.snapshotBytes.length,
          creator: snapshot.creator,
        },
      },
      { status: 201 }
    );
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
    console.error('Create snapshot error:', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
}

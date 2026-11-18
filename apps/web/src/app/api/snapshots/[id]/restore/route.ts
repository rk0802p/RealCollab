import { NextResponse } from 'next/server';
import * as Y from 'yjs';
import { prisma, hasPermission } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { getSnapshotAccess } from '@/lib/workspaceAuth';

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { snapshot, membership } = await getSnapshotAccess(params.id, user.id);

    // Enforce RBAC: only OWNER or EDITOR can restore historical versions
    if (!hasPermission(membership.role, 'canEditContent')) {
      return NextResponse.json(
        { error: 'Viewers and Commenters are not permitted to restore document versions' },
        { status: 403 }
      );
    }

    const pageId = snapshot.pageId;

    // 1. Reconstruct current document state to take a pre-restore checkpoint
    const currentDoc = new Y.Doc();
    const latestPreSnapshot = await prisma.documentSnapshot.findFirst({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
    });

    if (latestPreSnapshot && latestPreSnapshot.snapshotBytes) {
      Y.applyUpdate(currentDoc, new Uint8Array(latestPreSnapshot.snapshotBytes));
    }

    const currentUpdates = await prisma.documentUpdate.findMany({
      where: {
        pageId,
        ...(latestPreSnapshot ? { createdAt: { gt: latestPreSnapshot.createdAt } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const u of currentUpdates) {
      Y.applyUpdate(currentDoc, new Uint8Array(u.updateBytes));
    }

    const preRestoreBytes = Y.encodeStateAsUpdate(currentDoc);
    currentDoc.destroy();

    // 2. Create automatic pre-restore checkpoint so current state is never lost
    const preRestoreCheckpoint = await prisma.documentSnapshot.create({
      data: {
        pageId,
        createdById: user.id,
        description: `Automatic checkpoint before restoring version from ${snapshot.createdAt.toLocaleString()}`,
        snapshotBytes: Buffer.from(preRestoreBytes),
      },
    });

    // 3. Decode the target snapshot to extract its restored content
    const restoredDoc = new Y.Doc();
    Y.applyUpdate(restoredDoc, new Uint8Array(snapshot.snapshotBytes));
    const restoredText =
      restoredDoc.getText('default').toString() ||
      restoredDoc.getXmlFragment('default').toString();
    restoredDoc.destroy();

    // 4. Write the restored state as a new DocumentUpdate and update Page content
    await prisma.documentUpdate.create({
      data: {
        pageId,
        updateBytes: snapshot.snapshotBytes,
      },
    });

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        content: restoredText || snapshot.page.content,
      },
    });

    // 5. Also record a snapshot for the newly restored state
    const newRestoredSnapshot = await prisma.documentSnapshot.create({
      data: {
        pageId,
        createdById: user.id,
        description: `Restored version from ${snapshot.createdAt.toLocaleString()} (${snapshot.description || 'Checkpoint'})`,
        snapshotBytes: snapshot.snapshotBytes,
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

    return NextResponse.json({
      success: true,
      message: 'Document restored successfully',
      restoredSnapshot: {
        id: newRestoredSnapshot.id,
        pageId: newRestoredSnapshot.pageId,
        description: newRestoredSnapshot.description,
        createdAt: newRestoredSnapshot.createdAt.toISOString(),
        createdById: newRestoredSnapshot.createdById,
        sizeBytes: newRestoredSnapshot.snapshotBytes.length,
        creator: newRestoredSnapshot.creator,
      },
      preRestoreCheckpoint: {
        id: preRestoreCheckpoint.id,
        description: preRestoreCheckpoint.description,
      },
      page: updatedPage,
      restoredText,
    });
  } catch (error: any) {
    if (error.message === 'SNAPSHOT_NOT_FOUND') {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }
    if (error.message === 'NOT_A_WORKSPACE_MEMBER') {
      return NextResponse.json(
        { error: 'You do not have permission to access this document' },
        { status: 403 }
      );
    }
    console.error('Restore snapshot error:', error);
    return NextResponse.json({ error: 'Failed to restore document snapshot' }, { status: 500 });
  }
}

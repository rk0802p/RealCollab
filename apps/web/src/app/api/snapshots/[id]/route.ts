import { NextResponse } from 'next/server';
import * as Y from 'yjs';
import { hasPermission } from '@realcollab/shared';
import { getCurrentUser } from '@/lib/auth';
import { getSnapshotAccess } from '@/lib/workspaceAuth';

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { snapshot, membership } = await getSnapshotAccess(params.id, user.id);

    if (!hasPermission(membership.role, 'canViewPages')) {
      return NextResponse.json(
        { error: 'You do not have permission to view this snapshot' },
        { status: 403 }
      );
    }

    // Decode snapshot to extract text content for preview
    const tempDoc = new Y.Doc();
    Y.applyUpdate(tempDoc, new Uint8Array(snapshot.snapshotBytes));
    const contentText =
      tempDoc.getText('default').toString() ||
      tempDoc.getXmlFragment('default').toString() ||
      snapshot.page.content ||
      '';
    tempDoc.destroy();

    const snapshotBase64 = Buffer.from(snapshot.snapshotBytes).toString('base64');

    return NextResponse.json({
      snapshot: {
        id: snapshot.id,
        pageId: snapshot.pageId,
        description: snapshot.description || 'Snapshot checkpoint',
        createdAt: snapshot.createdAt.toISOString(),
        createdById: snapshot.createdById,
        sizeBytes: snapshot.snapshotBytes.length,
        creator: snapshot.creator,
      },
      contentText,
      snapshotBase64,
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
    console.error('Fetch snapshot preview error:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshot preview' }, { status: 500 });
  }
}

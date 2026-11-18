import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireWorkspacePermission } from '@/lib/workspaceAuth';
import { revokeInvitation } from '@/services/invitationService';

interface RouteContext {
  params: { id: string; inviteId: string };
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: workspaceId, inviteId } = params;

  try {
    await requireWorkspacePermission(workspaceId, user.id, 'canInviteMembers');

    const success = await revokeInvitation(inviteId, workspaceId);
    if (!success) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Invitation revoked' });
  } catch (error: any) {
    if (error.message === 'NOT_A_WORKSPACE_MEMBER' || error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'You do not have permission to manage invitations' },
        { status: 403 }
      );
    }
    console.error('Revoke invitation error:', error);
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { acceptInvitation } from '@/services/invitationService';

interface RouteContext {
  params: { token: string };
}

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'You must be logged in to accept an invitation' },
      { status: 401 }
    );
  }

  const { token } = params;

  try {
    const result = await acceptInvitation(token, user.id);
    return NextResponse.json({
      success: true,
      message: 'Successfully joined workspace',
      workspaceId: result.workspace.id,
      workspaceName: result.workspace.name,
      role: result.role,
    });
  } catch (error: any) {
    if (error.message === 'INVITATION_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Invitation not found or has already been accepted/revoked' },
        { status: 404 }
      );
    }
    if (error.message === 'INVITATION_EXPIRED') {
      return NextResponse.json(
        { error: 'This invitation has expired. Please request a new invite link.' },
        { status: 410 }
      );
    }
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}

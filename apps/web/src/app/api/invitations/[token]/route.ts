import { NextResponse } from 'next/server';
import { getInvitationByToken } from '@/services/invitationService';

interface RouteContext {
  params: { token: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = params;

  try {
    const invite = await getInvitationByToken(token);
    if (!invite) {
      return NextResponse.json(
        { error: 'Invitation not found or has been revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      invitation: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        isExpired: invite.isExpired,
        workspace: invite.workspace,
        inviter: invite.inviter,
      },
    });
  } catch (error: any) {
    console.error('Fetch invitation details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    );
  }
}

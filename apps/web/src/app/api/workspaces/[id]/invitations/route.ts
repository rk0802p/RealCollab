import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireWorkspacePermission } from '@/lib/workspaceAuth';
import { createInvitation, listPendingInvitations } from '@/services/invitationService';
import { z } from 'zod';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';

interface RouteContext {
  params: { id: string };
}

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER']).default('EDITOR'),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = params.id;

  try {
    // Only members with canInviteMembers (e.g. OWNER) can see pending invitations
    await requireWorkspacePermission(workspaceId, user.id, 'canInviteMembers');

    const invitations = await listPendingInvitations(workspaceId);
    return NextResponse.json({ invitations });
  } catch (error: any) {
    if (error.message === 'NOT_A_WORKSPACE_MEMBER' || error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'You do not have permission to view invitations for this workspace' },
        { status: 403 }
      );
    }
    console.error('Fetch invitations error:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 10 invitation creates per minute per user/IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`${user.id}:${clientIp}`, {
    keyPrefix: 'invitations_create',
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many invitations generated. Please try again later.' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  }

  const workspaceId = params.id;

  try {
    await requireWorkspacePermission(workspaceId, user.id, 'canInviteMembers');

    const body = await request.json();
    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role, expiresInDays } = result.data;

    const { invitation, rawToken } = await createInvitation({
      workspaceId,
      email,
      role,
      inviterId: user.id,
      expiresInDays,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/invite/${rawToken}`;

    return NextResponse.json(
      {
        invitation,
        rawToken,
        inviteUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'ALREADY_A_MEMBER') {
      return NextResponse.json(
        { error: 'This user is already a member of the workspace' },
        { status: 409 }
      );
    }
    if (error.message === 'NOT_A_WORKSPACE_MEMBER' || error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'You do not have permission to invite members to this workspace' },
        { status: 403 }
      );
    }
    console.error('Create invitation error:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}

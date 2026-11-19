import { NextResponse } from 'next/server';
import { getCurrentUser, createSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await createSessionToken({ userId: user.id, email: user.email });

  return NextResponse.json({ user, token });
}

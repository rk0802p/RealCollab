import { NextResponse } from 'next/server';
import { prisma } from '@realcollab/shared';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // Rate limit: 5 login attempts per minute per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      keyPrefix: 'auth_login',
      limit: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token and cookie
    const token = await createSessionToken({ userId: user.id, email: user.email });
    setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during login',
        message: error?.message || 'Database connection error',
      },
      { status: 500 }
    );
  }
}

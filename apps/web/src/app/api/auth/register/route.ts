import { NextResponse } from 'next/server';
import { prisma } from '@realcollab/shared';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and initial workspace in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name,
          passwordHash,
        },
      });

      const defaultWorkspace = await tx.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          description: 'My primary collaborative workspace',
          ownerId: newUser.id,
          members: {
            create: {
              userId: newUser.id,
              role: 'OWNER',
            },
          },
        },
      });

      await tx.page.create({
        data: {
          workspaceId: defaultWorkspace.id,
          title: 'Getting Started 🚀',
          icon: '👋',
          createdById: newUser.id,
        },
      });

      return newUser;
    });

    // Create session token and set HTTP-only cookie
    const token = await createSessionToken({ userId: user.id, email: user.email });
    setSessionCookie(token);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}

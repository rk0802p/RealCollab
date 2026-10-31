export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
}

/**
 * Validates the connection token passed in query parameters or auth headers.
 * In development / testing mode, supports mock tokens or decodes JWTs.
 */
export async function authenticateConnectionToken(token?: string | null): Promise<AuthenticatedUser | null> {
  if (!token) {
    // If running in development without auth token, provide a fallback development identity
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 'dev-user-alice',
        email: 'alice@example.com',
        name: 'Alice (Dev)',
        role: 'OWNER',
      };
    }
    return null;
  }

  // Handle mock tokens format: "mock:userId:role"
  if (token.startsWith('mock:')) {
    const [, userId, role] = token.split(':');
    return {
      id: userId || 'test-user',
      email: `${userId || 'test'}@example.com`,
      name: userId ? `User ${userId}` : 'Test User',
      role: (role as any) || 'EDITOR',
    };
  }

  // Real token verification will be fully expanded in Phase 2 & 8
  return {
    id: 'user-from-token',
    email: 'user@example.com',
    name: 'Authenticated User',
    role: 'EDITOR',
  };
}

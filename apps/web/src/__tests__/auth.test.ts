import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../lib/auth';
import { ROLE_PERMISSIONS, hasPermission, canUserEdit, canUserComment } from '@realcollab/shared';

describe('Phase 2 — Authentication & Security Unit Tests', () => {
  it('hashes passwords securely and never matches plaintext directly', async () => {
    const password = 'mySecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

    const matches = await verifyPassword(password, hash);
    expect(matches).toBe(true);

    const wrongMatches = await verifyPassword('wrongPassword', hash);
    expect(wrongMatches).toBe(false);
  });

  it('signs and verifies JWT session tokens with claims', async () => {
    const payload = { userId: 'user-cuid-123', email: 'alice@example.com' };
    const token = await createSessionToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('user-cuid-123');
    expect(verified?.email).toBe('alice@example.com');
  });

  it('rejects tampered or malformed tokens', async () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';
    const verified = await verifySessionToken(invalidToken);
    expect(verified).toBeNull();
  });
});

describe('Phase 2 — Role-Based Access Control (RBAC) Permission Tests', () => {
  it('correctly grants OWNER full administrative and edit rights', () => {
    expect(hasPermission('OWNER', 'canViewPages')).toBe(true);
    expect(hasPermission('OWNER', 'canEditContent')).toBe(true);
    expect(hasPermission('OWNER', 'canAddComments')).toBe(true);
    expect(hasPermission('OWNER', 'canResolveComments')).toBe(true);
    expect(hasPermission('OWNER', 'canInviteMembers')).toBe(true);
    expect(hasPermission('OWNER', 'canChangeRoles')).toBe(true);
    expect(hasPermission('OWNER', 'canDeleteWorkspace')).toBe(true);
  });

  it('correctly permits EDITOR to edit and comment, but not administer members', () => {
    expect(hasPermission('EDITOR', 'canViewPages')).toBe(true);
    expect(hasPermission('EDITOR', 'canEditContent')).toBe(true);
    expect(hasPermission('EDITOR', 'canAddComments')).toBe(true);
    expect(hasPermission('EDITOR', 'canInviteMembers')).toBe(false);
    expect(hasPermission('EDITOR', 'canChangeRoles')).toBe(false);
    expect(hasPermission('EDITOR', 'canDeleteWorkspace')).toBe(false);
    expect(canUserEdit('EDITOR')).toBe(true);
  });

  it('correctly permits COMMENTER to view and comment, but NOT edit document content', () => {
    expect(hasPermission('COMMENTER', 'canViewPages')).toBe(true);
    expect(hasPermission('COMMENTER', 'canEditContent')).toBe(false);
    expect(hasPermission('COMMENTER', 'canAddComments')).toBe(true);
    expect(hasPermission('COMMENTER', 'canInviteMembers')).toBe(false);
    expect(canUserEdit('COMMENTER')).toBe(false);
    expect(canUserComment('COMMENTER')).toBe(true);
  });

  it('strictly limits VIEWER to read-only access', () => {
    expect(hasPermission('VIEWER', 'canViewPages')).toBe(true);
    expect(hasPermission('VIEWER', 'canEditContent')).toBe(false);
    expect(hasPermission('VIEWER', 'canAddComments')).toBe(false);
    expect(hasPermission('VIEWER', 'canResolveComments')).toBe(false);
    expect(hasPermission('VIEWER', 'canInviteMembers')).toBe(false);
    expect(canUserEdit('VIEWER')).toBe(false);
    expect(canUserComment('VIEWER')).toBe(false);
  });
});

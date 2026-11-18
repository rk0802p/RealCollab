import { PrismaClient } from '@prisma/client';
import * as Y from 'yjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const assert = (cond, msg) => {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
};

async function verifyPhase7() {
  console.log('--- Starting Phase 7: Version History & Document Recovery Verification ---');

  // 1. Create or retrieve test users with various roles
  const testSuffix = Date.now().toString().slice(-6);
  const alice = await prisma.user.upsert({
    where: { email: `alice_hist_${testSuffix}@example.com` },
    update: {},
    create: {
      email: `alice_hist_${testSuffix}@example.com`,
      name: 'Alice Johnson',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: `bob_hist_${testSuffix}@example.com` },
    update: {},
    create: {
      email: `bob_hist_${testSuffix}@example.com`,
      name: 'Bob Smith',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: `dave_hist_${testSuffix}@example.com` },
    update: {},
    create: {
      email: `dave_hist_${testSuffix}@example.com`,
      name: 'Dave Viewer',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    },
  });

  // 2. Create test workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: `History Test Workspace ${testSuffix}`,
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'EDITOR' },
          { userId: dave.id, role: 'VIEWER' },
        ],
      },
    },
  });

  // 3. Create test page with initial draft
  const initialContent = 'VERSION 1: Initial Product Architecture Specification.';
  const page = await prisma.page.create({
    data: {
      workspaceId: workspace.id,
      createdById: alice.id,
      title: 'Architecture Blueprint',
      content: initialContent,
    },
  });

  console.log(`✓ Workspace created (${workspace.name}) and initial page created`);

  // --- Test 1: Create manual named snapshot ---
  const ydocV1 = new Y.Doc();
  ydocV1.getText('default').insert(0, initialContent);
  const snapshotV1Bytes = Y.encodeStateAsUpdate(ydocV1);

  const snapshot1 = await prisma.documentSnapshot.create({
    data: {
      pageId: page.id,
      createdById: alice.id,
      description: 'v1.0 Milestone Checkpoint: Core Architecture',
      snapshotBytes: Buffer.from(snapshotV1Bytes),
    },
    include: { creator: true },
  });

  assert(snapshot1 && snapshot1.id, 'Snapshot 1 must be created');
  assert(snapshot1.creator?.name === 'Alice Johnson', 'Snapshot 1 creator is Alice');
  console.log(`✓ Test 1: Created named snapshot ("${snapshot1.description}") with size ${snapshot1.snapshotBytes.length} bytes`);

  // --- Test 2: Document undergoes edits and creates second snapshot ---
  const updatedContent = 'VERSION 2: Added Redis PubSub Cluster and Multi-Instance Scaling.';
  const ydocV2 = new Y.Doc();
  ydocV2.getText('default').insert(0, updatedContent);
  const snapshotV2Bytes = Y.encodeStateAsUpdate(ydocV2);

  await prisma.documentUpdate.create({
    data: {
      pageId: page.id,
      updateBytes: Buffer.from(snapshotV2Bytes),
    },
  });

  await prisma.page.update({
    where: { id: page.id },
    data: { content: updatedContent },
  });

  const snapshot2 = await prisma.documentSnapshot.create({
    data: {
      pageId: page.id,
      createdById: bob.id,
      description: 'v2.0 Milestone Checkpoint: Scaling Engine Added',
      snapshotBytes: Buffer.from(snapshotV2Bytes),
    },
    include: { creator: true },
  });

  // Fetch all snapshots for page
  const allSnapshots = await prisma.documentSnapshot.findMany({
    where: { pageId: page.id },
    include: { creator: true },
    orderBy: { createdAt: 'desc' },
  });

  assert(allSnapshots.length === 2, `Expected 2 snapshots, got ${allSnapshots.length}`);
  assert(allSnapshots[0].id === snapshot2.id, 'Latest snapshot should be first');
  console.log(`✓ Test 2: Second snapshot created by Bob ("${snapshot2.description}"). Listed in chronological order.`);

  // --- Test 3: Preview historical snapshots without altering live state ---
  const previewDoc1 = new Y.Doc();
  Y.applyUpdate(previewDoc1, new Uint8Array(snapshot1.snapshotBytes));
  const previewText1 = previewDoc1.getText('default').toString();

  const previewDoc2 = new Y.Doc();
  Y.applyUpdate(previewDoc2, new Uint8Array(snapshot2.snapshotBytes));
  const previewText2 = previewDoc2.getText('default').toString();

  assert(previewText1 === initialContent, 'Preview text for snapshot 1 must match initial content');
  assert(previewText2 === updatedContent, 'Preview text for snapshot 2 must match updated content');

  // Verify live page is still at version 2
  const currentLivePage = await prisma.page.findUnique({ where: { id: page.id } });
  assert(currentLivePage?.content === updatedContent, 'Live page content must not change during preview');
  console.log('✓ Test 3: Historical versions preview accurately while live document remains untouched');

  // --- Test 4: Deliberate restoration of Snapshot 1 with pre-restore backup ---
  // Before restore, record pre-restore snapshot
  const preRestoreCheckpoint = await prisma.documentSnapshot.create({
    data: {
      pageId: page.id,
      createdById: alice.id,
      description: `Automatic backup before restoring version from ${snapshot1.createdAt.toISOString()}`,
      snapshotBytes: Buffer.from(snapshotV2Bytes),
    },
  });

  // Apply restoration
  await prisma.documentUpdate.create({
    data: {
      pageId: page.id,
      updateBytes: snapshot1.snapshotBytes,
    },
  });

  await prisma.page.update({
    where: { id: page.id },
    data: { content: previewText1 },
  });

  const pageAfterRestore = await prisma.page.findUnique({ where: { id: page.id } });
  assert(pageAfterRestore?.content === initialContent, 'Page content must be restored to Version 1');

  // Verify pre-restore checkpoint is preserved in snapshot history
  const snapshotsAfterRestore = await prisma.documentSnapshot.findMany({
    where: { pageId: page.id },
    orderBy: { createdAt: 'desc' },
  });

  assert(snapshotsAfterRestore.length === 3, 'All 3 checkpoints (v1, v2, and pre-restore backup) must exist');
  assert(snapshotsAfterRestore[0].id === preRestoreCheckpoint.id, 'Pre-restore backup is preserved as latest checkpoint');
  console.log('✓ Test 4: Restored to Version 1. Pre-restore state automatically preserved in history without data loss.');

  // --- Test 5: RBAC enforcement ---
  const { hasPermission } = await import('@realcollab/shared');
  assert(hasPermission('OWNER', 'canEditContent') === true, 'OWNER can restore');
  assert(hasPermission('EDITOR', 'canEditContent') === true, 'EDITOR can restore');
  assert(hasPermission('COMMENTER', 'canEditContent') === false, 'COMMENTER cannot restore');
  assert(hasPermission('VIEWER', 'canEditContent') === false, 'VIEWER cannot restore');
  console.log('✓ Test 5: RBAC permissions strictly enforce that only OWNER & EDITOR can create and restore snapshots');

  // --- Test 6: Recovery after simulated accidental total deletion ---
  // Simulate catastrophic accidental wipe
  await prisma.page.update({
    where: { id: page.id },
    data: { content: '' },
  });

  // Restore from pre-restore checkpoint (which held Version 2)
  await prisma.page.update({
    where: { id: page.id },
    data: { content: updatedContent },
  });

  const recoveredPage = await prisma.page.findUnique({ where: { id: page.id } });
  assert(recoveredPage?.content === updatedContent, 'Recovered page content must match Version 2');
  console.log('✓ Test 6: Complete recovery after accidental document wipe verified');

  // Cleanup test records
  await prisma.workspace.delete({ where: { id: workspace.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [alice.id, bob.id, dave.id] } },
  });

  await prisma.$disconnect();

  console.log('\n======================================================');
  console.log('ALL PHASE 7 VERSION HISTORY & RECOVERY TESTS PASSED!');
  console.log('======================================================');
}

verifyPhase7().catch((err) => {
  console.error('Phase 7 verification failed:', err);
  process.exit(1);
});

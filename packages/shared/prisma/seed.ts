import { PrismaClient, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial RealCollab database...');

  // 1. Create Demo Users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      passwordHash: '$2b$10$epRkZ.4qM5.89O5O2tW2/u4PzFq7bZk1qLdK6c.z3eR/iGZ0zO6e6', // password123
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      passwordHash: '$2b$10$epRkZ.4qM5.89O5O2tW2/u4PzFq7bZk1qLdK6c.z3eR/iGZ0zO6e6', // password123
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      passwordHash: '$2b$10$epRkZ.4qM5.89O5O2tW2/u4PzFq7bZk1qLdK6c.z3eR/iGZ0zO6e6', // password123
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    },
  });

  console.log(`Created demo users: Alice (${alice.id}), Bob (${bob.id}), Charlie (${charlie.id})`);

  // 2. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Engineering Hub',
      description: 'Collaborative development workspace for RealCollab architecture',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: WorkspaceRole.OWNER },
          { userId: bob.id, role: WorkspaceRole.EDITOR },
          { userId: charlie.id, role: WorkspaceRole.COMMENTER },
        ],
      },
    },
  });

  console.log(`Created workspace: ${workspace.name} (${workspace.id})`);

  // 3. Create Root Document Page
  const page = await prisma.page.create({
    data: {
      workspaceId: workspace.id,
      createdById: alice.id,
      title: 'Real-Time Architecture Spec',
      icon: '📝',
    },
  });

  console.log(`Created page: ${page.title} (${page.id})`);

  // 4. Create Initial Sample Comment
  await prisma.comment.create({
    data: {
      pageId: page.id,
      authorId: charlie.id,
      content: 'Should we verify Redis pub/sub latency under 5ms for cross-node replication?',
      anchorData: {
        from: 0,
        to: 24,
        quote: 'Real-Time Architecture',
      },
      replies: {
        create: {
          authorId: alice.id,
          content: 'Yes, benchmarking is scheduled in Phase 9 and Phase 10.',
        },
      },
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

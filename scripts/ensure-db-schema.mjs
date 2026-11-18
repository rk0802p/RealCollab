import { execSync } from 'child_process';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.log('[DB-Sync] No DATABASE_URL provided. Skipping schema auto-push.');
  process.exit(0);
}

// Quick validation to prevent non-postgres attempts
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://') && !dbUrl.includes('postgres')) {
  console.log('[DB-Sync] DATABASE_URL does not appear to be PostgreSQL. Skipping schema auto-push.');
  process.exit(0);
}

console.log('[DB-Sync] Connecting to PostgreSQL to push Prisma schema and create tables...');
try {
  execSync('npx prisma db push --schema=packages/shared/prisma/schema.prisma --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('[DB-Sync] ✅ Database tables successfully synced!');
} catch (err) {
  console.warn('[DB-Sync] ⚠️ Warning: Failed to sync database schema automatically:', err.message);
}

declare const process: any;

import { PrismaClient } from '@prisma/client';

function sanitizeDatabaseUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  let url = raw.trim();

  // Strip surrounding double or single quotes
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }

  // Strip prefix if user accidentally pasted DATABASE_URL=... into the value field
  if (url.startsWith('DATABASE_URL=')) {
    url = url.replace(/^DATABASE_URL=/, '').trim();
    if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
      url = url.slice(1, -1).trim();
    }
  }

  // Strip psql prefix if copied from CLI snippet: e.g. psql "postgresql://..."
  const psqlMatch = url.match(/psql\s+['"]?(postgres(?:ql)?:\/\/[^\s'"]+)['"]?/);
  if (psqlMatch) {
    url = psqlMatch[1];
  }

  return url;
}

const sanitizedUrl = typeof process !== 'undefined' ? sanitizeDatabaseUrl(process.env?.DATABASE_URL) : undefined;
if (sanitizedUrl && typeof process !== 'undefined' && process.env) {
  process.env.DATABASE_URL = sanitizedUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: sanitizedUrl ? { db: { url: sanitizedUrl } } : undefined,
    log: process.env?.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env?.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';

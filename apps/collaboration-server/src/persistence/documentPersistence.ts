import * as Y from 'yjs';
import { prisma } from '@realcollab/shared';

export interface PersistenceAdapter {
  loadDocument(pageId: string, ydoc: Y.Doc): Promise<void>;
  saveUpdate(pageId: string, update: Uint8Array, ydoc?: Y.Doc): Promise<void>;
  createSnapshot(pageId: string, ydoc: Y.Doc, description?: string): Promise<void>;
}

export class PostgresDocumentPersistence implements PersistenceAdapter {
  // In-memory fallback if database is not reachable
  private memoryUpdates = new Map<string, Uint8Array[]>();
  // Debounce buffer for batching update writes
  private pendingUpdates = new Map<string, Uint8Array[]>();
  private flushTimers = new Map<string, NodeJS.Timeout>();
  private updateCounters = new Map<string, number>();

  async loadDocument(pageId: string, ydoc: Y.Doc): Promise<void> {
    try {
      // 1. Check for latest snapshot
      const latestSnapshot = await prisma.documentSnapshot.findFirst({
        where: { pageId },
        orderBy: { createdAt: 'desc' },
      });

      if (latestSnapshot && latestSnapshot.snapshotBytes) {
        Y.applyUpdate(ydoc, new Uint8Array(latestSnapshot.snapshotBytes));
      }

      // 2. Load all incremental updates created after the snapshot
      const incrementalUpdates = await prisma.documentUpdate.findMany({
        where: {
          pageId,
          ...(latestSnapshot ? { createdAt: { gt: latestSnapshot.createdAt } } : {}),
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const updateRow of incrementalUpdates) {
        Y.applyUpdate(ydoc, new Uint8Array(updateRow.updateBytes));
      }

      console.log(
        `[Persistence] Loaded page ${pageId}: ${latestSnapshot ? '1 snapshot + ' : ''}${incrementalUpdates.length} updates.`
      );
    } catch (err: any) {
      console.warn(`[Persistence] Database load failed for page ${pageId}, checking in-memory cache:`, err.message);
      // Fallback to in-memory store
      const mem = this.memoryUpdates.get(pageId) || [];
      for (const update of mem) {
        Y.applyUpdate(ydoc, update);
      }
    }
  }

  async saveUpdate(pageId: string, update: Uint8Array, ydoc?: Y.Doc): Promise<void> {
    // Keep in memory buffer
    const memList = this.memoryUpdates.get(pageId) || [];
    memList.push(update);
    this.memoryUpdates.set(pageId, memList);

    // Queue for debounced write to PostgreSQL
    const pending = this.pendingUpdates.get(pageId) || [];
    pending.push(update);
    this.pendingUpdates.set(pageId, pending);

    // Clear existing timer if any
    const existingTimer = this.flushTimers.get(pageId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set debounced flush timer (400ms)
    const timer = setTimeout(async () => {
      await this.flushPendingUpdates(pageId, ydoc);
    }, 400);

    this.flushTimers.set(pageId, timer);
  }

  private async flushPendingUpdates(pageId: string, ydoc?: Y.Doc): Promise<void> {
    const updates = this.pendingUpdates.get(pageId);
    if (!updates || updates.length === 0) return;

    this.pendingUpdates.delete(pageId);
    this.flushTimers.delete(pageId);

    try {
      // Verify page exists in database before attempting insert to respect foreign key
      const pageExists = await prisma.page.findUnique({
        where: { id: pageId },
        select: { id: true },
      });

      if (!pageExists) {
        // Kept in memory store for non-persisted / test rooms
        return;
      }

      // Merge multiple pending updates into a single compact binary delta
      const merged = updates.length === 1 ? updates[0] : Y.mergeUpdates(updates);

      await prisma.documentUpdate.create({
        data: {
          pageId,
          updateBytes: Buffer.from(merged),
        },
      });

      // Track total updates to periodically create a snapshot
      const count = (this.updateCounters.get(pageId) || 0) + updates.length;
      this.updateCounters.set(pageId, count);

      if (ydoc && count >= 50) {
        this.updateCounters.set(pageId, 0);
        await this.createSnapshot(pageId, ydoc, 'Automatic periodic snapshot checkpoint');
      }
    } catch (err: any) {
      console.error(`[Persistence] Error writing updates for page ${pageId}:`, err.message);
    }
  }

  async createSnapshot(pageId: string, ydoc: Y.Doc, description?: string): Promise<void> {
    try {
      const pageExists = await prisma.page.findUnique({
        where: { id: pageId },
        select: { id: true },
      });

      if (!pageExists) return;

      const snapshotBytes = Y.encodeStateAsUpdate(ydoc);
      await prisma.documentSnapshot.create({
        data: {
          pageId,
          snapshotBytes: Buffer.from(snapshotBytes),
          description: description || 'Document snapshot checkpoint',
        },
      });
      console.log(`[Persistence] Created snapshot checkpoint for page ${pageId}`);
    } catch (err: any) {
      console.error(`[Persistence] Error creating snapshot for page ${pageId}:`, err.message);
    }
  }
}

export const persistence: PersistenceAdapter = new PostgresDocumentPersistence();

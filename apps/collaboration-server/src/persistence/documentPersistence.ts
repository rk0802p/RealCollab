import * as Y from 'yjs';

export interface PersistenceAdapter {
  loadDocument(pageId: string, ydoc: Y.Doc): Promise<void>;
  saveUpdate(pageId: string, update: Uint8Array): Promise<void>;
  createSnapshot(pageId: string, ydoc: Y.Doc, description?: string): Promise<void>;
}

/**
 * In-memory fallback persistence when database is not connected during initial phases.
 */
class InMemoryPersistence implements PersistenceAdapter {
  private updates = new Map<string, Uint8Array[]>();

  async loadDocument(pageId: string, ydoc: Y.Doc): Promise<void> {
    const docUpdates = this.updates.get(pageId) || [];
    for (const update of docUpdates) {
      Y.applyUpdate(ydoc, update);
    }
  }

  async saveUpdate(pageId: string, update: Uint8Array): Promise<void> {
    const list = this.updates.get(pageId) || [];
    list.push(update);
    this.updates.set(pageId, list);
  }

  async createSnapshot(pageId: string, ydoc: Y.Doc, description?: string): Promise<void> {
    const snapshotBytes = Y.encodeStateAsUpdate(ydoc);
    this.updates.set(pageId, [snapshotBytes]);
  }
}

export const persistence: PersistenceAdapter = new InMemoryPersistence();

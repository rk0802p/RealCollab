import * as Y from 'yjs';
import { DocumentSnapshotSummary, SnapshotPreview } from '@/types';

export const snapshotService = {
  async getSnapshots(pageId: string): Promise<DocumentSnapshotSummary[]> {
    const res = await fetch(`/api/pages/${pageId}/snapshots`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch snapshots');
    }
    const data = await res.json();
    return data.snapshots || [];
  },

  async createSnapshot(
    pageId: string,
    description?: string,
    ydoc?: Y.Doc | null
  ): Promise<DocumentSnapshotSummary> {
    let snapshotBase64: string | undefined;

    if (ydoc) {
      try {
        const bytes = Y.encodeStateAsUpdate(ydoc);
        // Browser/Node base64 conversion
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        snapshotBase64 = btoa(binary);
      } catch (err) {
        console.warn('Could not encode client Y.Doc for snapshot, falling back to server state:', err);
      }
    }

    const res = await fetch(`/api/pages/${pageId}/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, snapshotBase64 }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create snapshot');
    }

    const data = await res.json();
    return data.snapshot;
  },

  async getSnapshotPreview(snapshotId: string): Promise<SnapshotPreview> {
    const res = await fetch(`/api/snapshots/${snapshotId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch snapshot preview');
    }
    return await res.json();
  },

  async restoreSnapshot(snapshotId: string): Promise<any> {
    const res = await fetch(`/api/snapshots/${snapshotId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to restore snapshot');
    }

    return await res.json();
  },
};

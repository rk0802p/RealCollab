'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';
import { DocumentSnapshotSummary } from '@/types';
import { snapshotService } from '@/services/snapshotService';

interface UseVersionHistoryOptions {
  pageId: string | null;
  ydoc?: Y.Doc | null;
  enabled?: boolean;
}

export function useVersionHistory({ pageId, ydoc, enabled = true }: UseVersionHistoryOptions) {
  const [snapshots, setSnapshots] = useState<DocumentSnapshotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewingSnapshot, setPreviewingSnapshot] = useState<DocumentSnapshotSummary | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);

  const loadSnapshots = useCallback(async () => {
    if (!pageId || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await snapshotService.getSnapshots(pageId);
      setSnapshots(data);
    } catch (err: any) {
      console.error('Error loading snapshots:', err);
      setError(err.message || 'Failed to load snapshots');
    } finally {
      setIsLoading(false);
    }
  }, [pageId, enabled]);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const createNamedSnapshot = useCallback(
    async (description: string) => {
      if (!pageId) return;
      try {
        const newSnapshot = await snapshotService.createSnapshot(pageId, description, ydoc);
        setSnapshots((prev) => [newSnapshot, ...prev]);
        return newSnapshot;
      } catch (err: any) {
        console.error('Error creating snapshot:', err);
        throw err;
      }
    },
    [pageId, ydoc]
  );

  const previewSnapshot = useCallback(async (snapshotId: string) => {
    setIsLoading(true);
    try {
      const preview = await snapshotService.getSnapshotPreview(snapshotId);
      setPreviewingSnapshot(preview.snapshot);
      setPreviewContent(preview.contentText);
      setPreviewBase64(preview.snapshotBase64);
    } catch (err: any) {
      console.error('Error previewing snapshot:', err);
      setError(err.message || 'Failed to preview snapshot');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exitPreview = useCallback(() => {
    setPreviewingSnapshot(null);
    setPreviewContent(null);
    setPreviewBase64(null);
  }, []);

  const restoreSnapshot = useCallback(
    async (snapshotId: string) => {
      try {
        const result = await snapshotService.restoreSnapshot(snapshotId);
        exitPreview();
        await loadSnapshots();
        return result;
      } catch (err: any) {
        console.error('Error restoring snapshot:', err);
        throw err;
      }
    },
    [exitPreview, loadSnapshots]
  );

  return {
    snapshots,
    isLoading,
    error,
    previewingSnapshot,
    previewContent,
    previewBase64,
    loadSnapshots,
    createNamedSnapshot,
    previewSnapshot,
    exitPreview,
    restoreSnapshot,
  };
}

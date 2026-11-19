'use client';

import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Eye,
  Plus,
  Bookmark,
  Clock,
  Check,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { DocumentSnapshotSummary } from '@/types';

interface VersionHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: DocumentSnapshotSummary[];
  previewingSnapshot: DocumentSnapshotSummary | null;
  onPreviewSnapshot: (id: string) => Promise<void>;
  onExitPreview: () => void;
  onRestoreSnapshot: (id: string) => Promise<any>;
  onCreateCheckpoint: (description: string) => Promise<any>;
  userRole?: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
}

export function VersionHistorySidebar({
  isOpen,
  onClose,
  snapshots,
  previewingSnapshot,
  onPreviewSnapshot,
  onExitPreview,
  onRestoreSnapshot,
  onCreateCheckpoint,
  userRole = 'EDITOR',
}: VersionHistorySidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [checkpointDesc, setCheckpointDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  if (!isOpen) return null;

  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointDesc.trim() || isSubmitting || !canEdit) return;
    setIsSubmitting(true);
    try {
      await onCreateCheckpoint(checkpointDesc.trim());
      setCheckpointDesc('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create snapshot checkpoint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRestore = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onRestoreSnapshot(id);
      setConfirmRestoreId(null);
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <aside className="clay clay-sky rounded-panel w-80 md:w-96 flex flex-col h-full select-none p-3.5 border border-sky-deep/25 shadow-clay flex-shrink-0 overflow-hidden">
      {/* Sidebar Header */}
      <div className="clay clay-paper clay-card p-3 flex items-center justify-between border border-line/10 mb-2.5 shadow-clay-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm text-ink-1">Version History</h2>
          <span className="clay clay-inset bg-canvas px-2 py-0.5 text-[11px] font-bold text-ink-2 rounded-full">
            {snapshots.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canEdit && (
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="p-1 rounded-control text-ink-3 hover:text-primary hover:bg-canvas transition-all"
              title="Create named snapshot checkpoint"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-control text-ink-3 hover:text-ink-1 transition-all"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Preview Banner */}
      {previewingSnapshot && (
        <div className="clay clay-butter clay-card p-3.5 border border-butter-deep/30 space-y-2 text-xs mb-2.5 shadow-clay-sm flex-shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-ink-1 font-bold">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-warn" />
              Previewing historical version
            </span>
            <button
              onClick={onExitPreview}
              className="text-ink-2 hover:text-ink-1 text-[11px] font-semibold underline"
            >
              Exit
            </button>
          </div>
          <div className="text-[11px] text-ink-2 font-medium">
            {previewingSnapshot.description || 'Snapshot'} • {formatTimestamp(previewingSnapshot.createdAt)}
          </div>
          {canEdit ? (
            <button
              onClick={() => setConfirmRestoreId(previewingSnapshot.id)}
              className="w-full py-1.5 px-3 rounded-control bg-primary hover:bg-primary-deep text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-clay-sm"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore this version</span>
            </button>
          ) : (
            <p className="text-[10px] text-ink-3 italic font-medium">
              Viewers and commenters cannot restore historical versions.
            </p>
          )}
        </div>
      )}

      {/* New Named Checkpoint Modal / Inline Form */}
      {isCreating && canEdit && (
        <form onSubmit={handleCreate} className="clay clay-paper clay-card p-3.5 border border-primary/30 space-y-2.5 text-xs mb-2.5 shadow-clay flex-shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-ink-1">
            <span className="flex items-center gap-1.5 text-primary-deep">
              <Bookmark className="w-3.5 h-3.5 text-primary" />
              Create named snapshot
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-ink-3 hover:text-ink-1 text-[10px] font-semibold"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            placeholder="e.g. Major draft revision, Before client review..."
            value={checkpointDesc}
            onChange={(e) => setCheckpointDesc(e.target.value)}
            autoFocus
            className="clay clay-inset bg-canvas w-full text-xs border border-line/10 rounded-control p-2.5 text-ink-1 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2.5 py-1 text-xs rounded-control text-ink-3 hover:text-ink-1 hover:bg-canvas transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!checkpointDesc.trim() || isSubmitting}
              className="px-3.5 py-1 text-xs rounded-control bg-primary text-white font-bold hover:bg-primary-deep disabled:opacity-50 transition-all shadow-clay-sm"
            >
              Save Checkpoint
            </button>
          </div>
        </form>
      )}

      {/* Snapshot Confirmation Modal */}
      {confirmRestoreId && (
        <div className="clay clay-peach clay-card p-3.5 border border-peach-deep/40 space-y-2 text-xs mb-2.5 shadow-clay flex-shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-err font-bold">
            <ShieldAlert className="w-4 h-4 text-err" />
            <span>Confirm Version Restore</span>
          </div>
          <p className="text-ink-1 text-[11px] leading-relaxed font-medium">
            Restoring will roll back document content to this snapshot. An automatic backup checkpoint of your current state will be saved before restoring.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setConfirmRestoreId(null)}
              disabled={isSubmitting}
              className="px-2.5 py-1 rounded-control text-ink-2 hover:text-ink-1 hover:bg-canvas transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmRestore(confirmRestoreId)}
              disabled={isSubmitting}
              className="px-3.5 py-1 rounded-control bg-err hover:opacity-90 text-white font-bold transition-all flex items-center gap-1 shadow-clay-sm"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Confirm & Restore</span>
            </button>
          </div>
        </div>
      )}

      {/* Snapshots Timeline List */}
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-2.5 min-h-0">
        {/* Current Live State Card */}
        <div className="clay clay-mint clay-card p-3 border border-mint-deep/30 shadow-clay-sm text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-ok flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
              Current Live Version
            </span>
            <span className="text-[10px] text-ok font-mono font-bold">Live</span>
          </div>
          <p className="text-ink-2 text-[11px] font-medium">Active collaborative document</p>
        </div>

        {/* Empty state */}
        {snapshots.length === 0 && (
          <div className="text-center py-12 text-ink-3 text-xs space-y-2">
            <Clock className="w-8 h-8 mx-auto opacity-35" />
            <p className="font-semibold">No historical snapshots yet.</p>
            {canEdit && (
              <p className="text-[11px] text-ink-3 font-medium">
                Click "+" above to save a named checkpoint.
              </p>
            )}
          </div>
        )}

        {/* Snapshot cards */}
        {snapshots.map((s) => {
          const isPreviewing = previewingSnapshot?.id === s.id;

          return (
            <div
              key={s.id}
              className={`clay clay-paper clay-card p-3.5 text-xs space-y-2 transition-all shadow-clay-sm ${
                isPreviewing
                  ? 'border-2 border-warn/70 shadow-clay ring-2 ring-warn/25'
                  : 'border border-line/10 hover:border-line/25'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-ink-1 leading-snug truncate">
                    {s.description || 'Snapshot Checkpoint'}
                  </div>
                  <div className="text-[10px] text-ink-3 flex items-center gap-1.5 font-medium">
                    <span>{formatTimestamp(s.createdAt)}</span>
                    {s.creator && (
                      <>
                        <span>•</span>
                        <span className="truncate">{s.creator.name}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="font-mono text-[9px] text-ink-3">
                      {(s.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-line/10">
                <button
                  onClick={() => {
                    if (isPreviewing) {
                      onExitPreview();
                    } else {
                      onPreviewSnapshot(s.id);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-control text-[11px] font-bold transition-all flex items-center gap-1 ${
                    isPreviewing
                      ? 'clay clay-inset bg-butter/40 text-primary-deep shadow-clay-press'
                      : 'clay clay-paper text-ink-2 hover:text-ink-1 hover:bg-canvas shadow-clay-sm border border-line/10'
                  }`}
                  title={isPreviewing ? 'Exit preview' : 'Preview this version'}
                >
                  <Eye className="w-3 h-3" />
                  <span>{isPreviewing ? 'Previewing' : 'Preview'}</span>
                </button>

                {canEdit && (
                  <button
                    onClick={() => setConfirmRestoreId(s.id)}
                    className="clay clay-paper px-2.5 py-1 rounded-control text-[11px] font-bold text-primary hover:text-primary-deep hover:bg-canvas transition-all flex items-center gap-1 shadow-clay-sm border border-line/10"
                    title="Restore document to this version"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

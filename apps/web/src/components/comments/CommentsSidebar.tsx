'use client';

import React, { useState } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Trash2,
  Pencil,
  CornerDownRight,
  Quote,
  Check,
} from 'lucide-react';
import { CommentThread, CommentAnchorData } from '@/types';

interface CommentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CommentThread[];
  activeCommentId: string | null;
  onSelectComment: (id: string | null) => void;
  filter: 'all' | 'active' | 'resolved';
  onFilterChange: (filter: 'all' | 'active' | 'resolved') => void;
  pendingAnchor: CommentAnchorData | null;
  onClearPendingAnchor: () => void;
  onAddComment: (content: string, anchorData?: CommentAnchorData | null) => Promise<any>;
  onAddReply: (commentId: string, content: string) => Promise<any>;
  onToggleResolve: (commentId: string, resolved?: boolean) => Promise<any>;
  onDeleteComment: (commentId: string) => Promise<any>;
  onUpdateComment?: (commentId: string, content: string) => Promise<any>;
  onScrollToAnchor?: (anchorData: CommentAnchorData) => void;
  currentUser?: { id: string; name: string } | null;
  userRole?: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
}

export function CommentsSidebar({
  isOpen,
  onClose,
  comments,
  activeCommentId,
  onSelectComment,
  filter,
  onFilterChange,
  pendingAnchor,
  onClearPendingAnchor,
  onAddComment,
  onAddReply,
  onToggleResolve,
  onDeleteComment,
  onUpdateComment,
  onScrollToAnchor,
  currentUser,
  userRole = 'EDITOR',
}: CommentsSidebarProps) {
  const [draftContent, setDraftContent] = useState('');
  const [generalComment, setGeneralComment] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const canComment = userRole !== 'VIEWER';

  const activeCount = comments.filter((c) => !c.resolved).length;
  const resolvedCount = comments.filter((c) => c.resolved).length;

  const filteredComments = comments.filter((c) => {
    if (filter === 'active') return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  const handleCreatePendingComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftContent.trim() || isSubmitting || !canComment) return;
    setIsSubmitting(true);
    try {
      await onAddComment(draftContent.trim(), pendingAnchor);
      setDraftContent('');
      onClearPendingAnchor();
    } catch (err) {
      console.error('Failed to post anchored comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGeneralComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalComment.trim() || isSubmitting || !canComment) return;
    setIsSubmitting(true);
    try {
      await onAddComment(generalComment.trim(), null);
      setGeneralComment('');
    } catch (err) {
      console.error('Failed to post general comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (commentId: string) => {
    const text = replyDrafts[commentId]?.trim();
    if (!text || isSubmitting || !canComment) return;
    setIsSubmitting(true);
    try {
      await onAddReply(commentId, text);
      setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim() || !onUpdateComment) return;
    try {
      await onUpdateComment(commentId, editContent.trim());
      setEditingCommentId(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to update comment:', err);
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
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <aside className="w-88 w-[22rem] border-l border-slate-800 bg-surface flex flex-col h-full shadow-2xl z-30 select-none">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-surface/90">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-sm text-slate-100">Discussions</h2>
          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[11px] font-mono">
            {comments.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-card transition"
          title="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs: Active vs Resolved */}
      <div className="flex border-b border-slate-800/80 bg-surface-card/40 px-3 py-1.5 gap-2 text-xs">
        <button
          onClick={() => onFilterChange('active')}
          className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1.5 ${
            filter === 'active'
              ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Active</span>
          <span className="text-[10px] px-1 bg-surface rounded-full">{activeCount}</span>
        </button>
        <button
          onClick={() => onFilterChange('resolved')}
          className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1.5 ${
            filter === 'resolved'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Resolved</span>
          <span className="text-[10px] px-1 bg-surface rounded-full">{resolvedCount}</span>
        </button>
        <button
          onClick={() => onFilterChange('all')}
          className={`px-2 py-1 rounded font-medium transition ${
            filter === 'all'
              ? 'bg-slate-700/50 text-slate-100'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          All
        </button>
      </div>

      {/* Comments List & Pending Draft */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 select-text">
        {/* Pending Anchored Comment Creation Box */}
        {pendingAnchor && (
          <div className="p-3 rounded-lg border border-brand-500/50 bg-brand-950/20 shadow-lg space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-brand-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-brand-400" />
                Comment on selection
              </span>
              <button
                onClick={onClearPendingAnchor}
                className="text-slate-400 hover:text-slate-200 text-[11px]"
              >
                Cancel
              </button>
            </div>

            {pendingAnchor.quote && (
              <div className="border-l-2 border-brand-500 pl-2.5 py-1 text-xs text-slate-300 italic bg-brand-900/10 rounded-r">
                "{pendingAnchor.quote}"
              </div>
            )}

            {canComment ? (
              <form onSubmit={handleCreatePendingComment} className="space-y-2 pt-1">
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Add a comment or thought..."
                  rows={2}
                  autoFocus
                  className="w-full text-xs bg-surface-card border border-slate-700 rounded-md p-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClearPendingAnchor}
                    className="px-2.5 py-1 text-xs rounded text-slate-400 hover:text-slate-200 hover:bg-surface-card transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!draftContent.trim() || isSubmitting}
                    className="px-3 py-1 text-xs rounded bg-brand-600 text-white font-medium hover:bg-brand-500 disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Comment</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-amber-400/80 italic">
                Viewers are not permitted to add comments.
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {filteredComments.length === 0 && !pendingAnchor && (
          <div className="text-center py-12 text-slate-500 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
            <p>
              {filter === 'resolved'
                ? 'No resolved comments.'
                : 'No active comments. Select text in the document to start a discussion.'}
            </p>
          </div>
        )}

        {/* Thread items */}
        {filteredComments.map((thread) => {
          const isSelected = activeCommentId === thread.id;
          const isAuthor = currentUser?.id === thread.author.id;
          const isOwner = userRole === 'OWNER';
          const canDelete = isAuthor || isOwner;
          const canEditThis = isAuthor && !thread.resolved;

          return (
            <div
              key={thread.id}
              onClick={() => onSelectComment(thread.id)}
              className={`p-3 rounded-lg border text-xs space-y-2.5 transition shadow-sm ${
                isSelected
                  ? 'border-brand-500/80 bg-surface-card ring-1 ring-brand-500/50'
                  : thread.resolved
                  ? 'bg-surface-card/30 border-slate-800/60 opacity-60'
                  : 'bg-surface-card border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Anchored Quote preview */}
              {thread.anchorData?.quote && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (thread.anchorData) onScrollToAnchor?.(thread.anchorData);
                  }}
                  title="Click to jump to highlighted text"
                  className="border-l-2 border-amber-400 pl-2 py-0.5 text-xs text-amber-200/90 italic bg-amber-950/20 rounded-r hover:bg-amber-950/40 cursor-pointer transition flex items-center justify-between"
                >
                  <span className="truncate max-w-[200px]">"{thread.anchorData.quote}"</span>
                  <span className="text-[10px] text-amber-400/70 not-italic ml-1 font-mono">jump ↗</span>
                </div>
              )}

              {/* Author & Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-brand-700 text-white flex items-center justify-center text-[10px] font-bold">
                    {thread.author.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-200">{thread.author.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                  <span>{formatTimestamp(thread.createdAt)}</span>
                  {thread.resolved && (
                    <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-700/60 text-emerald-400 rounded text-[9px] font-medium flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              {/* Comment Content (or inline edit form) */}
              {editingCommentId === thread.id ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-xs bg-surface border border-brand-500 rounded p-1.5 text-slate-100 focus:outline-none"
                    rows={2}
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="px-2 py-0.5 text-[10px] rounded text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(thread.id)}
                      className="px-2 py-0.5 text-[10px] rounded bg-brand-600 text-white font-medium hover:bg-brand-500"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-300 leading-relaxed break-words">{thread.content}</p>
              )}

              {/* Actions row: Resolve / Reopen, Edit, Delete */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                {canComment ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleResolve(thread.id, !thread.resolved);
                    }}
                    className={`flex items-center gap-1 transition font-medium ${
                      thread.resolved
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    {thread.resolved ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>Reopen</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolve</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-1">
                  {canEditThis && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCommentId(thread.id);
                        setEditContent(thread.content);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-surface transition"
                      title="Edit comment"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this comment thread?')) {
                          onDeleteComment(thread.id);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-surface transition"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Threaded Replies */}
              {thread.replies && thread.replies.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/50 pl-3">
                  {thread.replies.map((reply) => (
                    <div key={reply.id} className="space-y-1 text-slate-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CornerDownRight className="w-3 h-3 text-slate-500" />
                          <span className="font-semibold text-slate-200 text-[11px]">
                            {reply.author.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {formatTimestamp(reply.createdAt)}
                        </span>
                      </div>
                      <p className="pl-4 text-slate-300 text-xs leading-relaxed break-words">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input Form */}
              {canComment && !thread.resolved && (
                <div
                  className="pt-1.5 flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    placeholder="Reply..."
                    value={replyDrafts[thread.id] || ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendReply(thread.id);
                      }
                    }}
                    className="flex-1 text-xs bg-surface border border-slate-700/80 rounded px-2.5 py-1 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={() => handleSendReply(thread.id)}
                    disabled={!replyDrafts[thread.id]?.trim() || isSubmitting}
                    className="p-1 text-brand-400 hover:text-brand-300 disabled:opacity-30 transition"
                    title="Send reply"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Page-level general comment input at bottom */}
      {canComment && (
        <form
          onSubmit={handleCreateGeneralComment}
          className="p-3 border-t border-slate-800 bg-surface/90 flex gap-2 items-center"
        >
          <input
            type="text"
            placeholder="Add general comment on document..."
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            className="flex-1 text-xs bg-surface-card border border-slate-700 rounded-md px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!generalComment.trim() || isSubmitting}
            className="p-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-40 transition"
            title="Post comment"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </aside>
  );
}

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
    <aside className="clay clay-mint rounded-panel w-80 md:w-96 flex flex-col h-full select-none p-3.5 border border-mint-deep/25 shadow-clay flex-shrink-0 overflow-hidden">
      {/* Sidebar Header */}
      <div className="clay clay-paper clay-card p-3 flex items-center justify-between border border-line/10 mb-2.5 shadow-clay-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm text-ink-1">Discussions</h2>
          <span className="clay clay-inset bg-canvas px-2 py-0.5 text-[11px] font-bold text-ink-2 rounded-full">
            {comments.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-control text-ink-3 hover:text-ink-1 transition-all"
          title="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs: Active vs Resolved */}
      <div className="flex gap-1.5 p-1 mb-2.5 flex-shrink-0 text-xs">
        <button
          onClick={() => onFilterChange('active')}
          className={`px-3 py-1.5 rounded-control font-bold transition-all flex items-center gap-1.5 ${
            filter === 'active'
              ? 'clay clay-paper text-primary-deep shadow-clay-sm border border-primary/20'
              : 'text-ink-2 hover:bg-paper/50'
          }`}
        >
          <span>Active</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-canvas/80 rounded-full">{activeCount}</span>
        </button>
        <button
          onClick={() => onFilterChange('resolved')}
          className={`px-3 py-1.5 rounded-control font-bold transition-all flex items-center gap-1.5 ${
            filter === 'resolved'
              ? 'clay clay-paper text-ok shadow-clay-sm border border-ok/20'
              : 'text-ink-2 hover:bg-paper/50'
          }`}
        >
          <span>Resolved</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-canvas/80 rounded-full">{resolvedCount}</span>
        </button>
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 rounded-control font-bold transition-all ${
            filter === 'all'
              ? 'clay clay-paper text-ink-1 shadow-clay-sm border border-line/15'
              : 'text-ink-2 hover:bg-paper/50'
          }`}
        >
          All
        </button>
      </div>

      {/* Comments List & Pending Draft */}
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-3 min-h-0 select-text">
        {/* Pending Anchored Comment Creation Box */}
        {pendingAnchor && (
          <div className="clay clay-paper clay-card p-3.5 border border-primary/30 shadow-clay space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-primary-deep font-bold">
              <span className="flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-primary" />
                Comment on selection
              </span>
              <button
                onClick={onClearPendingAnchor}
                className="text-ink-3 hover:text-ink-1 text-[11px] font-semibold"
              >
                Cancel
              </button>
            </div>

            {pendingAnchor.quote && (
              <div className="border-l-3 border-primary pl-2.5 py-1 text-xs text-ink-2 italic bg-lavender/30 rounded-r font-medium">
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
                  className="clay clay-inset bg-canvas w-full text-xs border border-line/10 rounded-control p-2.5 text-ink-1 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-medium"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClearPendingAnchor}
                    className="px-2.5 py-1 text-xs rounded-control text-ink-3 hover:text-ink-1 hover:bg-canvas transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!draftContent.trim() || isSubmitting}
                    className="px-3.5 py-1 text-xs rounded-control bg-primary text-white font-bold hover:bg-primary-deep disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-clay-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>Comment</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-warn italic font-medium">
                Viewers are not permitted to add comments.
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {filteredComments.length === 0 && !pendingAnchor && (
          <div className="text-center py-12 text-ink-3 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-35" />
            <p className="font-semibold">
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
              className={`clay clay-paper clay-card p-3.5 text-xs space-y-2.5 transition-all shadow-clay-sm cursor-pointer ${
                isSelected
                  ? 'border-2 border-primary/60 shadow-clay ring-2 ring-primary/20'
                  : thread.resolved
                  ? 'border border-line/10 opacity-70'
                  : 'border border-line/10 hover:border-line/25'
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
                  className="border-l-3 border-butter-deep pl-2.5 py-1 text-xs text-ink-1 italic bg-butter/40 rounded-r hover:bg-butter/60 cursor-pointer transition-all flex items-center justify-between font-medium"
                >
                  <span className="truncate max-w-[200px]">"{thread.anchorData.quote}"</span>
                  <span className="text-[10px] text-primary-deep not-italic ml-1 font-mono font-bold">jump ↗</span>
                </div>
              )}

              {/* Author & Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shadow-clay-sm">
                    {thread.author.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-ink-1">{thread.author.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-3 text-[10px] font-medium">
                  <span>{formatTimestamp(thread.createdAt)}</span>
                  {thread.resolved && (
                    <span className="px-2 py-0.5 clay clay-inset bg-mint/50 border border-mint-deep/30 text-ok rounded-full text-[10px] font-bold flex items-center gap-1">
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
                    className="clay clay-inset bg-canvas w-full text-xs border border-primary/40 rounded-control p-2 text-ink-1 focus:outline-none font-medium"
                    rows={2}
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="px-2.5 py-1 text-[10px] rounded-control text-ink-3 hover:text-ink-1 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(thread.id)}
                      className="px-2.5 py-1 text-[10px] rounded-control bg-primary text-white font-bold hover:bg-primary-deep shadow-clay-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-ink-1 font-medium leading-relaxed break-words">{thread.content}</p>
              )}

              {/* Actions row: Resolve / Reopen, Edit, Delete */}
              <div className="flex items-center justify-between pt-1 border-t border-line/10 text-[11px]">
                {canComment ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleResolve(thread.id, !thread.resolved);
                    }}
                    className={`flex items-center gap-1 transition-all font-bold ${
                      thread.resolved
                        ? 'text-warn hover:text-primary'
                        : 'text-ok hover:text-primary-deep'
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
                      className="p-1 rounded-control text-ink-3 hover:text-ink-1 hover:bg-canvas transition-all"
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
                      className="p-1 rounded-control text-ink-3 hover:text-err hover:bg-canvas transition-all"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Threaded Replies */}
              {thread.replies && thread.replies.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-line/10 pl-3">
                  {thread.replies.map((reply) => (
                    <div key={reply.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CornerDownRight className="w-3 h-3 text-ink-3" />
                          <span className="font-bold text-ink-1 text-[11px]">
                            {reply.author.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-ink-3 font-medium">
                          {formatTimestamp(reply.createdAt)}
                        </span>
                      </div>
                      <p className="pl-4 text-ink-1 font-medium text-xs leading-relaxed break-words">
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
                    className="clay clay-inset bg-canvas flex-1 text-xs border border-line/10 rounded-control px-2.5 py-1 text-ink-1 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
                  />
                  <button
                    onClick={() => handleSendReply(thread.id)}
                    disabled={!replyDrafts[thread.id]?.trim() || isSubmitting}
                    className="p-1.5 text-primary hover:text-primary-deep disabled:opacity-30 transition-all"
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
          className="clay clay-paper clay-card p-2.5 mt-2 flex gap-2 items-center border border-line/10 shadow-clay-sm flex-shrink-0"
        >
          <input
            type="text"
            placeholder="Add general comment on document..."
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            className="clay clay-inset bg-canvas flex-1 text-xs border border-line/10 rounded-control px-3 py-1.5 text-ink-1 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
          />
          <button
            type="submit"
            disabled={!generalComment.trim() || isSubmitting}
            className="p-1.5 rounded-control bg-primary text-white hover:bg-primary-deep disabled:opacity-40 transition-all shadow-clay-sm"
            title="Post comment"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </aside>
  );
}

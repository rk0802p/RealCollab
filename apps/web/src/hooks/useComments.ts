'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CommentThread, CommentAnchorData } from '@/types';
import { commentService } from '@/services/commentService';

interface UseCommentsOptions {
  pageId: string | null;
  enabled?: boolean;
}

export function useComments({ pageId, enabled = true }: UseCommentsOptions) {
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!pageId || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await commentService.getComments(pageId);
      setComments(data);
    } catch (err: any) {
      console.error('Error loading comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [pageId, enabled]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const activeComments = useMemo(
    () => comments.filter((c) => !c.resolved),
    [comments]
  );

  const resolvedComments = useMemo(
    () => comments.filter((c) => c.resolved),
    [comments]
  );

  const filteredComments = useMemo(() => {
    if (filter === 'active') return activeComments;
    if (filter === 'resolved') return resolvedComments;
    return comments;
  }, [comments, filter, activeComments, resolvedComments]);

  const addComment = useCallback(
    async (content: string, anchorData?: CommentAnchorData | null) => {
      if (!pageId) return;
      const newComment = await commentService.createComment(pageId, content, anchorData);
      setComments((prev) => [...prev, newComment]);
      setActiveCommentId(newComment.id);
      return newComment;
    },
    [pageId]
  );

  const updateComment = useCallback(async (commentId: string, content: string) => {
    const updated = await commentService.updateComment(commentId, content);
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    return updated;
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    await commentService.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setActiveCommentId((prev) => (prev === commentId ? null : prev));
  }, []);

  const addReply = useCallback(async (commentId: string, content: string) => {
    const reply = await commentService.addReply(commentId, content);
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...(c.replies || []), reply],
          };
        }
        return c;
      })
    );
    return reply;
  }, []);

  const toggleResolve = useCallback(async (commentId: string, resolved?: boolean) => {
    const updated = await commentService.toggleResolve(commentId, resolved);
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    return updated;
  }, []);

  return {
    comments,
    filteredComments,
    activeComments,
    resolvedComments,
    activeCommentId,
    setActiveCommentId,
    filter,
    setFilter,
    isLoading,
    error,
    loadComments,
    addComment,
    updateComment,
    deleteComment,
    addReply,
    toggleResolve,
  };
}

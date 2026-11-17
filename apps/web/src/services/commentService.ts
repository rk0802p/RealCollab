import { CommentThread, CommentReply, CommentAnchorData } from '@/types';

export const commentService = {
  async getComments(pageId: string): Promise<CommentThread[]> {
    const res = await fetch(`/api/pages/${pageId}/comments`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch comments');
    }
    const data = await res.json();
    return data.comments || [];
  },

  async createComment(
    pageId: string,
    content: string,
    anchorData?: CommentAnchorData | null
  ): Promise<CommentThread> {
    const res = await fetch(`/api/pages/${pageId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, anchorData }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create comment');
    }
    const data = await res.json();
    return data.comment;
  },

  async updateComment(commentId: string, content: string): Promise<CommentThread> {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update comment');
    }
    const data = await res.json();
    return data.comment;
  },

  async deleteComment(commentId: string): Promise<void> {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete comment');
    }
  },

  async addReply(commentId: string, content: string): Promise<CommentReply> {
    const res = await fetch(`/api/comments/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add reply');
    }
    const data = await res.json();
    return data.reply;
  },

  async toggleResolve(commentId: string, resolved?: boolean): Promise<CommentThread> {
    const res = await fetch(`/api/comments/${commentId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolved !== undefined ? { resolved } : {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to toggle resolve status');
    }
    const data = await res.json();
    return data.comment;
  },
};

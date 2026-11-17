export interface Collaborator {
  clientId: number;
  userId?: string;
  name: string;
  color: string;
  avatar?: string;
  role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
  isTyping?: boolean;
  lastActive?: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface CommentAnchorData {
  quote?: string;
  from?: number;
  to?: number;
  startRelPos?: any;
  endRelPos?: any;
}

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface CommentReply {
  id: string;
  commentId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

export interface CommentThread {
  id: string;
  pageId: string;
  authorId: string;
  content: string;
  anchorData?: CommentAnchorData | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  replies: CommentReply[];
}

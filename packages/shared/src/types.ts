import { WorkspaceRole } from './permissions';

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  role: WorkspaceRole;
}

export interface PageSummary {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  title: string;
  content?: string | null;
  icon?: string | null;
  coverImage?: string | null;
  updatedAt: string;
}

export interface CollabUserPresence {
  name: string;
  color: string;
  avatar?: string;
  activeBlockId?: string;
}

export interface AnchorData {
  from: number;
  to: number;
  quote?: string;
  relativePosFrom?: string;
  relativePosTo?: string;
}

export interface CommentWithReplies {
  id: string;
  pageId: string;
  author: UserSummary;
  content: string;
  anchorData?: AnchorData | null;
  resolved: boolean;
  createdAt: string;
  replies: Array<{
    id: string;
    author: UserSummary;
    content: string;
    createdAt: string;
  }>;
}

export interface SnapshotSummary {
  id: string;
  pageId: string;
  description?: string | null;
  createdByName?: string | null;
  createdAt: string;
}

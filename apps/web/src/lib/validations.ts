import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  description: z.string().optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['EDITOR', 'COMMENTER', 'VIEWER']),
});

export const updateRoleSchema = z.object({
  role: z.enum(['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER']),
});

export const createPageSchema = z.object({
  title: z.string().min(1, 'Page title cannot be empty').default('Untitled'),
  icon: z.string().optional().default('📝'),
  parentId: z.string().nullable().optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});

export const anchorDataSchema = z
  .object({
    quote: z.string().optional(),
    from: z.number().optional(),
    to: z.number().optional(),
    startRelPos: z.any().optional(),
    endRelPos: z.any().optional(),
  })
  .optional()
  .nullable();

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  anchorData: anchorDataSchema,
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

export const createReplySchema = z.object({
  content: z.string().min(1, 'Reply cannot be empty'),
});

export const resolveCommentSchema = z.object({
  resolved: z.boolean().optional(),
});

export const createSnapshotSchema = z.object({
  description: z.string().min(1, 'Snapshot description cannot be empty').max(255).optional(),
  snapshotBase64: z.string().optional(),
});

export const restoreSnapshotSchema = z.object({
  createCheckpoint: z.boolean().optional().default(true),
});

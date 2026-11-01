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
  icon: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});

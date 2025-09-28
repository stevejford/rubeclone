import { z } from 'zod';

export const workspaceCreateSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['personal', 'company'], {
    required_error: 'Workspace type is required',
  }),
});

export const workspaceUpdateSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

export const memberInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member'], {
    required_error: 'Role is required',
  }),
});

export const memberRoleUpdateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['admin', 'member'], {
    required_error: 'Role is required',
  }),
});

export const workspaceToolSchema = z.object({
  toolSlug: z.string().min(1, 'Tool slug is required'),
  config: z.record(z.any()).optional(),
});

export type WorkspaceCreateInput = z.infer<typeof workspaceCreateSchema>;
export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;
export type MemberInviteInput = z.infer<typeof memberInviteSchema>;
export type MemberRoleUpdateInput = z.infer<typeof memberRoleUpdateSchema>;
export type WorkspaceToolInput = z.infer<typeof workspaceToolSchema>;

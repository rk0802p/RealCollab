import { WorkspaceRole } from '@prisma/client';

export type { WorkspaceRole };

export interface RolePermissions {
  canViewPages: boolean;
  canEditContent: boolean;
  canAddComments: boolean;
  canResolveComments: boolean;
  canInviteMembers: boolean;
  canChangeRoles: boolean;
  canDeleteWorkspace: boolean;
}

export const ROLE_PERMISSIONS: Record<WorkspaceRole, RolePermissions> = {
  OWNER: {
    canViewPages: true,
    canEditContent: true,
    canAddComments: true,
    canResolveComments: true,
    canInviteMembers: true,
    canChangeRoles: true,
    canDeleteWorkspace: true,
  },
  EDITOR: {
    canViewPages: true,
    canEditContent: true,
    canAddComments: true,
    canResolveComments: true,
    canInviteMembers: false,
    canChangeRoles: false,
    canDeleteWorkspace: false,
  },
  COMMENTER: {
    canViewPages: true,
    canEditContent: false,
    canAddComments: true,
    canResolveComments: true,
    canInviteMembers: false,
    canChangeRoles: false,
    canDeleteWorkspace: false,
  },
  VIEWER: {
    canViewPages: true,
    canEditContent: false,
    canAddComments: false,
    canResolveComments: false,
    canInviteMembers: false,
    canChangeRoles: false,
    canDeleteWorkspace: false,
  },
};

export function hasPermission(role: WorkspaceRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export function canUserEdit(role?: WorkspaceRole | null): boolean {
  if (!role) return false;
  return hasPermission(role, 'canEditContent');
}

export function canUserComment(role?: WorkspaceRole | null): boolean {
  if (!role) return false;
  return hasPermission(role, 'canAddComments');
}

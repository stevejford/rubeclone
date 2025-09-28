import { WorkspaceMemberRole } from '@/lib/db/types';

export interface WorkspacePermissions {
  canManageMembers: boolean;
  canManageTools: boolean;
  canEditWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canViewWorkspace: boolean;
}

export function getWorkspacePermissions(
  userRole: WorkspaceMemberRole | null,
  isOwner: boolean
): WorkspacePermissions {
  // Owner has all permissions
  if (isOwner) {
    return {
      canManageMembers: true,
      canManageTools: true,
      canEditWorkspace: true,
      canDeleteWorkspace: true,
      canViewWorkspace: true,
    };
  }

  // Admin permissions
  if (userRole === 'admin') {
    return {
      canManageMembers: true,
      canManageTools: true,
      canEditWorkspace: true,
      canDeleteWorkspace: false, // Only owner can delete
      canViewWorkspace: true,
    };
  }

  // Member permissions
  if (userRole === 'member') {
    return {
      canManageMembers: false,
      canManageTools: false,
      canEditWorkspace: false,
      canDeleteWorkspace: false,
      canViewWorkspace: true,
    };
  }

  // No access
  return {
    canManageMembers: false,
    canManageTools: false,
    canEditWorkspace: false,
    canDeleteWorkspace: false,
    canViewWorkspace: false,
  };
}

export function canManageMembers(
  userRole: WorkspaceMemberRole | null,
  isOwner: boolean
): boolean {
  return isOwner || userRole === 'admin';
}

export function canManageTools(
  userRole: WorkspaceMemberRole | null,
  isOwner: boolean
): boolean {
  return isOwner || userRole === 'admin';
}

export function canEditWorkspace(
  userRole: WorkspaceMemberRole | null,
  isOwner: boolean
): boolean {
  return isOwner || userRole === 'admin';
}

export function canDeleteWorkspace(isOwner: boolean): boolean {
  return isOwner;
}

export function canViewWorkspace(
  userRole: WorkspaceMemberRole | null,
  isOwner: boolean
): boolean {
  return isOwner || userRole === 'admin' || userRole === 'member';
}

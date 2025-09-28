'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { MemberList } from '@/components/workspaces/member-list';
import { InviteMemberForm } from '@/components/workspaces/invite-member-form';
import { useWorkspace, useWorkspaceMembers } from '@/lib/hooks/use-workspace';

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, permissions, switchWorkspace } = useWorkspace();
  const {
    members,
    isLoading,
    error,
    addMember,
    updateMemberRole,
    removeMember,
  } = useWorkspaceMembers(workspaceId);

  const [isContextSwitching, setIsContextSwitching] = useState(false);

  // Switch workspace context if needed
  useEffect(() => {
    const switchWorkspaceIfNeeded = async () => {
      if (workspaceId && currentWorkspace?.id?.toString() !== workspaceId && !isContextSwitching) {
        setIsContextSwitching(true);
        try {
          await switchWorkspace(workspaceId);
        } catch (err) {
          console.error('Failed to switch workspace context:', err);
        } finally {
          setIsContextSwitching(false);
        }
      }
    };

    switchWorkspaceIfNeeded();
  }, [workspaceId, currentWorkspace?.id, switchWorkspace, isContextSwitching]);

  if (isLoading || isContextSwitching) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg" />
                ))}
              </div>
              <div className="h-64 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!permissions?.canViewWorkspace) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to view this workspace's members.
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-3 mb-8">
          <Users className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Workspace Members</h1>
            <p className="text-muted-foreground">
              Manage members and their roles in {currentWorkspace?.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Members ({members.length})
              </h2>
              {members.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No members yet</h3>
                  <p className="text-muted-foreground">
                    Invite your first team member to get started.
                  </p>
                </div>
              ) : (
                <MemberList
                  members={members}
                  workspaceOwnerId={currentWorkspace?.owner_id?.toString() || ''}
                  canManageMembers={permissions?.canManageMembers || false}
                  onUpdateRole={updateMemberRole}
                  onRemoveMember={removeMember}
                />
              )}
            </div>
          </div>

          <div>
            {permissions?.canManageMembers && (
              <InviteMemberForm onInvite={addMember} />
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

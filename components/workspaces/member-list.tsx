'use client';

import { useState } from 'react';
import { MoreHorizontal, Crown, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WorkspaceMember } from '@/lib/db/types';
import { useSession } from 'next-auth/react';

interface MemberListProps {
  members: WorkspaceMember[];
  workspaceOwnerId: string;
  canManageMembers: boolean;
  onUpdateRole: (userId: string, role: 'admin' | 'member') => Promise<boolean>;
  onRemoveMember: (userId: string) => Promise<boolean>;
}

export function MemberList({
  members,
  workspaceOwnerId,
  canManageMembers,
  onUpdateRole,
  onRemoveMember,
}: MemberListProps) {
  const { data: session } = useSession();
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleRoleUpdate = async (member: WorkspaceMember, newRole: 'admin' | 'member') => {
    if (member.role === newRole || !member.userId) return;

    setIsUpdating(member.userId);
    await onUpdateRole(member.userId, newRole);
    setIsUpdating(null);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !memberToRemove.userId) return;

    await onRemoveMember(memberToRemove.userId);
    setMemberToRemove(null);
  };

  const getRoleIcon = (role: string, isOwner: boolean) => {
    if (isOwner) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (role === 'admin') return <Shield className="h-4 w-4 text-blue-500" />;
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const getRoleBadge = (role: string, isOwner: boolean) => {
    if (isOwner) return <Badge variant="secondary">Owner</Badge>;
    if (role === 'admin') return <Badge variant="default">Admin</Badge>;
    return <Badge variant="outline">Member</Badge>;
  };

  return (
    <>
      <div className="space-y-4">
        {members.map((member) => {
          const isOwner = member.userId === workspaceOwnerId;
          const isCurrentUser = member.userId === session?.user?.id;
          const canModifyMember = canManageMembers && !isOwner && !isCurrentUser;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback>
                    {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{member.user.name || member.user.email}</p>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getRoleIcon(member.role, isOwner)}
                  {getRoleBadge(member.role, isOwner)}
                </div>

                {canModifyMember && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isUpdating === member.userId}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === 'member' ? (
                        <DropdownMenuItem
                          onClick={() => handleRoleUpdate(member, 'admin')}
                        >
                          Promote to Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleRoleUpdate(member, 'member')}
                        >
                          Demote to Member
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setMemberToRemove(member)}
                        className="text-destructive"
                      >
                        Remove from workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user.name || memberToRemove?.user.email} from this workspace?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

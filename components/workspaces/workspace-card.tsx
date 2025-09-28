'use client';

import { useRouter } from 'next/navigation';
import { Building2, User, Users, Wrench, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Workspace } from '@/lib/db/types';

interface WorkspaceCardProps {
  workspace: Workspace & {
    memberCount?: number;
    toolCount?: number;
    members?: Array<{
      user: {
        name: string | null;
        email: string;
        image: string | null;
      };
    }>;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function WorkspaceCard({ workspace, onEdit, onDelete }: WorkspaceCardProps) {
  const router = useRouter();

  const handleViewWorkspace = () => {
    router.push(`/workspaces/${workspace.id}`);
  };

  const handleManageMembers = () => {
    router.push(`/workspaces/${workspace.id}/members`);
  };

  const handleSettings = () => {
    router.push(`/workspaces/${workspace.id}/settings`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {workspace.type === 'company' ? (
            <Building2 className="h-5 w-5 text-muted-foreground" />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <CardTitle className="text-lg">{workspace.name}</CardTitle>
            <Badge variant={workspace.type === 'company' ? 'default' : 'secondary'}>
              {workspace.type}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewWorkspace}>
              View workspace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleManageMembers}>
              Manage members
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettings}>
              Settings
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {workspace.description && (
          <CardDescription className="mb-4">
            {workspace.description}
          </CardDescription>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{workspace.memberCount || 0} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <Wrench className="h-4 w-4" />
              <span>{workspace.toolCount || 0} tools</span>
            </div>
          </div>
        </div>

        {workspace.members && workspace.members.length > 0 && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex -space-x-2">
              {workspace.members.slice(0, 3).map((member: any, index: number) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {workspace.members.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    +{workspace.members.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <Button onClick={handleViewWorkspace} className="w-full">
          Open workspace
        </Button>
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, User, Users, Wrench, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/auth/auth-guard';
import { MainNav } from '@/components/navigation/main-nav';
import { useWorkspace, useWorkspaceMembers, useWorkspaceTools } from '@/lib/hooks/use-workspace';
import { WorkspaceWithDetails } from '@/lib/db/types';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const { currentWorkspace, permissions, switchWorkspace } = useWorkspace();
  const { members } = useWorkspaceMembers(workspaceId);
  const { tools } = useWorkspaceTools(workspaceId);

  const [workspace, setWorkspace] = useState<WorkspaceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContextSwitching, setIsContextSwitching] = useState(false);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch workspace');
        }

        const data = await response.json();
        setWorkspace(data.workspace);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId]);

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
        <MainNav variant="dashboard" />
        <div className="container mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !workspace) {
    return (
      <AuthGuard>
        <MainNav variant="dashboard" />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
            <p className="text-muted-foreground">{error || 'Workspace not found'}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainNav variant="dashboard" />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center space-x-3">
            {workspace.type === 'company' ? (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{workspace.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={workspace.type === 'company' ? 'default' : 'secondary'}>
                  {workspace.type}
                </Badge>
                {workspace.description && (
                  <p className="text-muted-foreground">{workspace.description}</p>
                )}
              </div>
            </div>
          </div>
          
          {permissions?.canEditWorkspace && (
            <Button
              variant="outline"
              onClick={() => router.push(`/workspaces/${workspaceId}/settings`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">
                Active workspace members
              </p>
              {permissions?.canManageMembers && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push(`/workspaces/${workspaceId}/members`)}
                >
                  Manage Members
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tools</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tools.length}</div>
              <p className="text-xs text-muted-foreground">
                Enabled workspace tools
              </p>
              {permissions?.canManageTools && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push(`/workspaces/${workspaceId}/tools`)}
                >
                  Manage Tools
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Recent activities
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Members</CardTitle>
              <CardDescription>
                Latest members to join this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-muted-foreground text-sm">No members yet</p>
              ) : (
                <div className="space-y-2">
                  {members.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.user.name || member.user.email}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enabled Tools</CardTitle>
              <CardDescription>
                Tools available in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tools.length === 0 ? (
                <p className="text-muted-foreground text-sm">No tools enabled yet</p>
              ) : (
                <div className="space-y-2">
                  {tools.slice(0, 5).map((tool) => (
                    <div key={tool.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{tool.toolSlug}</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

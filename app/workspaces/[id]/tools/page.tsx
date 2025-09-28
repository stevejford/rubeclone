'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Wrench, Store } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/auth-guard';
import { WorkspaceTools } from '@/components/workspaces/workspace-tools';
import { useWorkspace, useWorkspaceTools } from '@/lib/hooks/use-workspace';
import { Button } from '@/components/ui/button';

export default function WorkspaceToolsPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, permissions, switchWorkspace } = useWorkspace();
  const {
    tools,
    isLoading,
    error,
    enableTool,
    disableTool,
  } = useWorkspaceTools(workspaceId);
  
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
              You don't have permission to view this workspace's tools.
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Wrench className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold">Workspace Tools</h1>
              <p className="text-muted-foreground">
                Manage tools and integrations for {currentWorkspace?.name}
              </p>
            </div>
          </div>
          <Link href="/marketplace">
            <Button variant="outline" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Browse Marketplace
            </Button>
          </Link>
        </div>

        <WorkspaceTools
          tools={tools}
          canManageTools={permissions?.canManageTools || false}
          workspaceId={Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '')}
          onEnableTool={enableTool}
          onDisableTool={disableTool}
        />
      </div>
    </AuthGuard>
  );
}

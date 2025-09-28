'use client';

import { useState } from 'react';
import { Wrench, Plus, Settings, Trash2, ExternalLink, Store } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SearchAndFilters } from '@/components/marketplace/search-and-filters';
import { AppDetailsModal } from '@/components/marketplace/app-details-modal';
import { WorkspaceTool } from '@/lib/db/types';
import { useComposioConnection } from '@/lib/hooks/use-composio-connection';
import { ConnectionStatus } from '@/components/composio/connection-status';
import { OAuthConnectModal } from '@/components/composio/oauth-connect-modal';
import { useMarketplaceApps } from '@/lib/hooks/use-marketplace';
import { getAllCategories } from '@/lib/constants/categories';
import { RealMarketplaceApp } from '@/types/marketplace';

interface WorkspaceToolsProps {
  tools: WorkspaceTool[];
  canManageTools: boolean;
  workspaceId: string;
  onEnableTool: (toolSlug: string, config?: Record<string, any>) => Promise<boolean>;
  onDisableTool: (toolSlug: string) => Promise<boolean>;
}

// No longer needed - using real marketplace data

export function WorkspaceTools({
  tools,
  canManageTools,
  workspaceId,
  onEnableTool,
  onDisableTool,
}: WorkspaceToolsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<RealMarketplaceApp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectModalTool, setConnectModalTool] = useState<string | null>(null);
  const [showAppDetails, setShowAppDetails] = useState<RealMarketplaceApp | null>(null);

  // Use real marketplace data
  const {
    apps: marketplaceApps,
    loading: marketplaceLoading,
    error: marketplaceError,
    filters,
    setFilters
  } = useMarketplaceApps({
    initialFilters: {
      limit: 50 // Get more apps for selection
    }
  });

  const categories = getAllCategories();

  // Composio connection management
  const {
    getConnectionStatus,
    initiateConnection,
    disconnectTool,
    isConnecting,
    isDisconnecting,
    canManageConnections,
    refreshConnections,
  } = useComposioConnection({
    workspaceId,
    onConnectionSuccess: (toolkit) => {
      setConnectModalTool(null);
      // Optionally enable the tool after successful connection
      onEnableTool(toolkit);
    },
    onDisconnectSuccess: (toolkit: string) => {
      void toolkit // Suppress unused parameter warning
      // Tool will be disabled automatically by the disconnect API
      refreshConnections();
    },
  });

  const enabledToolSlugs = tools.map(tool => tool.toolSlug).filter(Boolean);
  const availableApps = marketplaceApps.filter(app => !enabledToolSlugs.includes(app.slug));

  const handleEnableTool = async () => {
    if (!selectedApp) return;

    setIsLoading(true);
    const success = await onEnableTool(selectedApp.slug);

    if (success) {
      setIsAddDialogOpen(false);
      setSelectedApp(null);
    }

    setIsLoading(false);
  };

  const handleDisableTool = async (toolSlug: string) => {
    setIsLoading(true);
    await onDisableTool(toolSlug);
    setIsLoading(false);
  };

  const handleConnectTool = async (toolSlug: string) => {
    try {
      await initiateConnection(toolSlug);
    } catch (error) {
      console.error('Failed to connect tool:', error);
    }
  };

  const handleDisconnectTool = async (toolSlug: string) => {
    const tool = tools.find(t => t.toolSlug === toolSlug);
    if (!(tool as any)?.connection_id) return;

    try {
      await disconnectTool(toolSlug);
    } catch (error) {
      console.error('Failed to disconnect tool:', error);
    }
  };

  const getToolInfo = (toolSlug: string) => {
    const app = marketplaceApps.find(a => a.slug === toolSlug);
    return app
      ? {
          name: app.name,
          description: app.description,
          category: app.category[0] || 'other',
          requiresAuth: app.requires_auth
        }
      : {
          name: toolSlug,
          description: 'Custom tool',
          category: 'Other',
          requiresAuth: false
        };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Workspace Tools</h2>
          <p className="text-muted-foreground">
            Manage tools and integrations for this workspace
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/marketplace">
            <Button variant="outline" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Browse Marketplace
            </Button>
          </Link>

          {canManageTools && availableApps.length > 0 && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tool
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Add Tool from Marketplace</DialogTitle>
                  <DialogDescription>
                    Browse and select tools to enable for this workspace.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex gap-6 h-[60vh]">
                  {/* Sidebar with filters */}
                  <div className="w-64 border-r pr-4">
                    <SearchAndFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      categories={categories}
                    />
                  </div>

                  {/* Apps grid */}
                  <div className="flex-1 overflow-y-auto">
                    {marketplaceLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : marketplaceError ? (
                      <div className="text-center text-red-600 p-4">
                        Failed to load marketplace apps
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableApps.map((app) => (
                          <Card
                            key={app.slug}
                            className={`cursor-pointer transition-colors ${
                              selectedApp?.slug === app.slug ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedApp(app)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">{app.name}</CardTitle>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAppDetails(app);
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <CardDescription className="text-xs line-clamp-2">
                                {app.description}
                              </CardDescription>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {app.category[0]}
                                </Badge>
                                {app.requires_auth && (
                                  <Badge variant="outline" className="text-xs">
                                    Auth Required
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setSelectedApp(null);
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEnableTool}
                    disabled={!selectedApp || isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Tool'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tools enabled</h3>
            <p className="text-muted-foreground text-center mb-4">
              Enable tools to extend your workspace capabilities and integrate with external services.
            </p>
            {canManageTools && (
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Tool
                </Button>
                <Link href="/marketplace">
                  <Button variant="outline">
                    <Store className="mr-2 h-4 w-4" />
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            if (!tool.toolSlug) return null;

            const toolInfo = getToolInfo(tool.toolSlug);
            const connectionStatus = toolInfo.requiresAuth ? getConnectionStatus(tool.toolSlug) : null;

            return (
              <Card key={tool.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4" />
                    <CardTitle className="text-base">{toolInfo.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Enabled</Badge>
                    {toolInfo.requiresAuth && (
                      <Badge variant="outline" className="text-xs">
                        OAuth
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>
                    {toolInfo.description}
                  </CardDescription>

                  {/* Connection Status for OAuth tools */}
                  {toolInfo.requiresAuth && connectionStatus && (
                    <ConnectionStatus
                      toolkit={tool.toolSlug}
                      status={connectionStatus}
                      onReconnect={() => setConnectModalTool(tool.toolSlug || '')}
                      onDisconnect={() => handleDisconnectTool(tool.toolSlug || '')}
                      isReconnecting={isConnecting}
                      isDisconnecting={isDisconnecting}
                      canManage={canManageConnections()}
                      className="border rounded-lg p-3 bg-muted/30"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{toolInfo.category}</Badge>

                    {canManageTools && (
                      <div className="flex space-x-2">
                        {toolInfo.requiresAuth && !connectionStatus?.isConnected && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setConnectModalTool(tool.toolSlug || '')}
                            disabled={isConnecting}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Connect
                          </Button>
                        )}

                        <Button variant="outline" size="sm">
                          <Settings className="h-3 w-3" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisableTool(tool.toolSlug!)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* OAuth Connect Modal */}
      {connectModalTool && (
        <OAuthConnectModal
          isOpen={!!connectModalTool}
          onClose={() => setConnectModalTool(null)}
          toolkit={connectModalTool}
          toolkitDisplayName={getToolInfo(connectModalTool).name}
          toolkitDescription={getToolInfo(connectModalTool).description}
          toolkitCategory={getToolInfo(connectModalTool).category}
          onConnect={() => handleConnectTool(connectModalTool)}
          isConnecting={isConnecting}
        />
      )}

      {/* App Details Modal */}
      {showAppDetails && (
        <AppDetailsModal
          app={showAppDetails}
          isOpen={!!showAppDetails}
          onClose={() => setShowAppDetails(null)}
          onInstall={(app) => {
            onEnableTool(app.slug);
            setShowAppDetails(null);
          }}
        />
      )}
    </div>
  );
}

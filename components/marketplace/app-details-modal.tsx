import { useState } from 'react';
import { X, ExternalLink, Star, Shield, Zap, Globe, Download, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RealMarketplaceApp, AppInstallationStatus } from '@/types/marketplace';
import { useAppInstallation } from '@/lib/hooks/use-marketplace';
import { useWorkspace } from '@/lib/hooks/use-workspace';
import { formatToolCount, getCategoryDisplayName, extractDomain, generateAppIcon } from '@/lib/utils/marketplace-helpers';

interface AppDetailsModalProps {
  app: RealMarketplaceApp | null;
  isOpen: boolean;
  onClose: () => void;
  installationStatus?: AppInstallationStatus | null;
  onInstall?: (app: RealMarketplaceApp) => void;
  onUninstall?: (app: RealMarketplaceApp) => void;
}

export function AppDetailsModal({
  app,
  isOpen,
  onClose,
  installationStatus,
  onInstall,
  onUninstall
}: AppDetailsModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'setup'>('overview');

  const {
    installApp,
    uninstallApp,
    installing,
    uninstalling,
    error: installError
  } = useAppInstallation({
    onSuccess: (result) => {
      if (app) {
        if (result.action === 'install') {
          onInstall?.(app);
        } else {
          onUninstall?.(app);
        }
      }
    },
    onError: (error) => {
      console.error('Installation error:', error);
    }
  });

  // Early return after all hooks are called
  if (!isOpen || !app) {
    return null;
  }

  const handleInstallClick = async () => {
    if (!currentWorkspace?.id) return;

    try {
      if (installationStatus?.is_installed) {
        await uninstallApp(app?.slug || '', currentWorkspace.id.toString());
      } else {
        await installApp(app?.slug || '', currentWorkspace.id.toString());
      }
    } catch (error) {
      console.error('Installation error:', error);
    }
  };

  const appIcon = app?.logo || generateAppIcon(app?.name || '');
  const primaryCategory = (Array.isArray(app?.category) ? app.category[0] : app?.category) || 'other';
  const displayCategory = getCategoryDisplayName(primaryCategory);
  const isInstalled = installationStatus?.is_installed || false;
  const isConnected = installationStatus?.is_connected || false;

  const getInstallButtonText = () => {
    if (installing) return 'Installing...';
    if (uninstalling) return 'Uninstalling...';
    if (app?.requires_auth && !isConnected) return 'Connect & Install';
    if (isInstalled) return 'Uninstall';
    return 'Install';
  };

  const getInstallButtonVariant = () => {
    if (isInstalled) return 'destructive';
    return 'default';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100 overflow-hidden">
                <img 
                  src={appIcon} 
                  alt={`${app?.name || 'App'} icon`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = generateAppIcon(app?.name || '');
                  }}
                />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{app?.name || 'App'}</DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  {app?.description || 'No description available'}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{displayCategory}</Badge>
                  {app?.requires_auth && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Auth Required
                    </Badge>
                  )}
                  {app?.pricing && app.pricing !== 'free' && (
                    <Badge variant="outline" className="capitalize">
                      {app.pricing}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              {app.tool_count !== undefined && (
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>{formatToolCount(app.tool_count)}</span>
                </div>
              )}
              {app.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{app.rating.toFixed(1)}</span>
                  {app.review_count && (
                    <span className="text-gray-400">({app.review_count})</span>
                  )}
                </div>
              )}
              {app.website_url && (
                <a 
                  href={app.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-blue-600"
                >
                  <Globe className="w-4 h-4" />
                  <span>{extractDomain(app.website_url)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              {installError && (
                <span className="text-sm text-red-600">Installation failed</span>
              )}
              <Button
                onClick={handleInstallClick}
                disabled={installing || uninstalling}
                variant={getInstallButtonVariant() as any}
                className="min-w-[120px]"
              >
                {getInstallButtonText()}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-6 border-b">
            {['overview', 'tools', 'setup'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <ScrollArea className="flex-1 px-6 pb-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 pt-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">About {app?.name || 'App'}</h3>
                <p className="text-gray-700 leading-relaxed">{app?.description || 'No description available'}</p>
              </div>

              {app?.tags && app.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {app.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Categories</h3>
                  <div className="space-y-2">
                    {Array.isArray(app?.category) ? app.category.map((cat) => (
                      <div key={cat} className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryDisplayName(cat)}
                        </Badge>
                      </div>
                    )) : app?.category ? (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryDisplayName(app.category)}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          Other
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Links</h3>
                  <div className="space-y-2">
                    {app.website_url && (
                      <a 
                        href={app.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {app.documentation_url && (
                      <a 
                        href={app.documentation_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Documentation</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {app.support_url && (
                      <a 
                        href={app.support_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <Users className="w-4 h-4" />
                        <span>Support</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-lg">Available Tools</h3>
              <p className="text-gray-600">
                This app provides {formatToolCount(app.tool_count || 0)} for automation and integration.
              </p>
              {/* TODO: Add actual tool list when toolkit details API is available */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Tool details will be loaded when you install this app.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-lg">Setup Instructions</h3>
              {app.requires_auth ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Authentication Required</span>
                    </div>
                    <p className="text-blue-800 text-sm">
                      This app requires you to connect your {app.name} account to authorize access to your data.
                    </p>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Click "Connect & Install" to begin the setup process</li>
                    <li>You'll be redirected to {app.name} to authorize access</li>
                    <li>Once authorized, the app will be installed in your workspace</li>
                    <li>You can then use {app.name} tools in your automations</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Download className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Simple Installation</span>
                    </div>
                    <p className="text-green-800 text-sm">
                      This app doesn't require authentication and can be installed directly.
                    </p>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Click "Install" to add this app to your workspace</li>
                    <li>The app will be immediately available for use</li>
                    <li>You can start using {app.name} tools in your automations</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

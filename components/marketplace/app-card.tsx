'use client'

import { Star, ExternalLink, Settings } from 'lucide-react'
// import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppInstallation } from '@/lib/hooks/use-marketplace'
import { useWorkspace } from '@/lib/hooks/use-workspace'
import { useToolAuth } from '@/lib/hooks/use-tool-auth'
import { useInstallPrompt } from '@/lib/hooks/use-install-prompt'
import { RealMarketplaceApp } from '@/types/marketplace'
import { formatToolCount, getCategoryDisplayName, formatAppStats, getAppFreshness, getOptimizedLogoUrl, getLogoQuality, generateAppIcon, getAlternativeIconSources } from '@/lib/utils/marketplace-helpers'
import { OAuthDialog } from './oauth-dialog'
import { AppSettingsDialog } from './app-settings-dialog'
import { AppDetailsModal } from './app-details-modal'

interface AppCardProps {
  app: RealMarketplaceApp
  variant?: 'grid' | 'list'
  showActions?: boolean
  onInstall?: (app: RealMarketplaceApp) => void
  onUninstall?: (app: RealMarketplaceApp) => void
}

export function AppCard({
  app,
  variant = 'grid',
  onInstall,
  onUninstall
}: AppCardProps) {
  const { currentWorkspace } = useWorkspace()
  const { handleInstallAttempt } = useInstallPrompt()
  const [showOAuthDialog, setShowOAuthDialog] = useState(false)
  const [oauthUrl, setOauthUrl] = useState<string | undefined>()
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [logoAttempts, setLogoAttempts] = useState<{[key: string]: number}>({})



  // Create a smart logo error handler that tries multiple sources
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>, appKey: string) => {
    const target = e.target as HTMLImageElement
    const currentSrc = target.src
    const attempts = logoAttempts[appKey] || 0

    // Get alternative sources to try
    const alternatives = [
      `https://logos.composio.dev/api/${app.slug}`,
      ...getAlternativeIconSources(app.name, app.slug),
      generateAppIcon(app.name)
    ]

    // Try next alternative if available
    if (attempts < alternatives.length - 1) {
      const nextSrc = alternatives[attempts + 1]
      if (nextSrc && nextSrc !== currentSrc) {
        setLogoAttempts(prev => ({ ...prev, [appKey]: attempts + 1 }))
        target.src = nextSrc
        return
      }
    }

    // Final fallback to generated icon
    target.src = generateAppIcon(app.name)
  }

  const {
    installApp,
    uninstallApp,
    installing,
    uninstalling,
    error: installError
  } = useAppInstallation({
    onSuccess: (result) => {
      console.log('App installation success:', result)
      if (result.action === 'install') {
        setIsInstalled(true)
        onInstall?.(app)
      } else {
        setIsInstalled(false)
        onUninstall?.(app)
      }
      // Refetch auth status after successful installation
      if (app.requires_auth) {
        refetchAuth()
      }
    },
    onError: (error) => {
      console.error('App installation error:', error)
    }
  })

  // Get authentication status for OAuth tools
  const {
    authStatus,
    loading: authLoading,
    refetch: refetchAuth,
    initiateAuth
  } = useToolAuth(
    app.slug,
    currentWorkspace?.id?.toString() || '',
    {
      enabled: app.requires_auth && !!currentWorkspace?.id,
      refreshInterval: 30000, // Check every 30 seconds
    }
  )

  // Get installation status from workspace tools
  const [isInstalled, setIsInstalled] = useState(false)

  // Check if tool is installed in current workspace
  useEffect(() => {
    if (!currentWorkspace?.id) return

    const checkInstallation = async () => {
      try {
        const response = await fetch(`/api/workspaces/${currentWorkspace.id}/tools`)
        if (response.ok) {
          const data = await response.json()
          const installed = data.tools?.some((tool: any) => tool.tool_slug === app.slug)
          setIsInstalled(installed)
        }
      } catch (error) {
        console.error('Error checking installation status:', error)
      }
    }

    checkInstallation()
  }, [currentWorkspace?.id, app.slug])
  const isAuthenticated = authStatus?.isConnected || false

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('🎯 Install button clicked for:', app.name, {
      slug: app.slug,
      requires_auth: app.requires_auth,
      isAuthenticated,
      authStatus,
      authLoading,
      isInstalled,
      workspaceId: currentWorkspace?.id,
      auth_schemes: app.auth_schemes
    })

    if (!currentWorkspace?.id) {
      // Show install prompt for unauthenticated users
      handleInstallAttempt(app.name)
      return
    }

    try {
      if (isInstalled) {
        await uninstallApp(app.slug, currentWorkspace.id.toString())
      } else {
        // Handle authentication (OAuth and/or API Key)
        if (app.requires_auth) {
          console.log('🔐 Authentication required for:', app.slug, 'Schemes:', app.auth_schemes, 'Is Authenticated:', isAuthenticated)

          // Always show dialog for apps that require authentication
          // The dialog will handle checking if user is already authenticated

          // If app supports OAuth, initiate OAuth flow to get redirect URL
          if (app.auth_schemes?.includes('OAUTH2')) {
            try {
              const result = await initiateAuth('marketplace') // Pass 'marketplace' as source
              if (result.redirectUrl) {
                setOauthUrl(result.redirectUrl)
              }
            } catch (error) {
              console.error('Failed to initiate OAuth:', error)
            }
          }

          // Show dialog for any authentication method (OAuth, API Key, or both)
          setShowOAuthDialog(true)
          return
        }

        console.log('📦 Installing app:', app.slug)
        await installApp(app.slug, currentWorkspace.id.toString())
      }
    } catch (error) {
      console.error('Installation error:', error)
    }
  }

  // const handleDetailsClick = (e: React.MouseEvent) => {
  //   e.preventDefault()
  //   e.stopPropagation()
  //   setShowDetails(true)
  // }

  // Determine button state and text
  const getButtonState = () => {
    if (installing || uninstalling || authLoading) {
      return {
        text: installing ? 'Installing...' : uninstalling ? 'Uninstalling...' : 'Loading...',
        variant: 'outline' as const,
        disabled: true
      }
    }

    if (!currentWorkspace?.id) {
      return { text: 'Sign in to Install', variant: 'outline' as const, disabled: false }
    }

    if (isInstalled) {
      return { text: 'Uninstall', variant: 'destructive' as const, disabled: false }
    }

    // Handle OAuth authentication (requires redirect)
    if (app.requires_auth && app.auth_schemes?.includes('OAUTH2') && !isAuthenticated) {
      return { text: 'Connect & Install', variant: 'default' as const, disabled: false }
    }

    // Handle API key authentication (requires manual setup)
    if (app.requires_auth && app.auth_schemes?.includes('API_KEY') && !app.auth_schemes?.includes('OAUTH2') && !isAuthenticated) {
      return { text: 'Setup API Key', variant: 'default' as const, disabled: false }
    }

    // Tool is authenticated or doesn't require auth
    return { text: 'Install', variant: 'default' as const, disabled: false }
  }

  const buttonState = getButtonState()
  const appIcon = getOptimizedLogoUrl(app)
  const logoQuality = getLogoQuality(app.logo)
  const primaryCategory = app.category[0] || 'other'
  const displayCategory = getCategoryDisplayName(primaryCategory)
  const appStats = formatAppStats(app)
  const freshness = getAppFreshness(app.updated_at)



  if (variant === 'list') {
    return (
      <div className="app-card group flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
        <div
          className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 cursor-pointer"
          onClick={() => setShowDetailsModal(true)}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-gray-100 flex-shrink-0 relative p-1">
            <img
              src={appIcon}
              alt={`${app.name} icon`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => handleLogoError(e, `list-${app.slug}`)}
            />
            {logoQuality === 'high' && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"
                   title="High quality logo" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base line-clamp-1">
              {app.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 sm:line-clamp-2 mt-0.5">
              {app.description}
            </p>
          </div>
        </div>

        {/* Metadata - hidden on mobile, visible on tablet+ */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4 text-sm text-gray-500 flex-shrink-0">
          {app.tool_count !== undefined && app.tool_count > 0 && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatToolCount(app.tool_count)}
            </span>
          )}
          {app.rating !== undefined && app.rating !== null && app.rating > 0 && (
            <span className="flex items-center space-x-1 whitespace-nowrap">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{app.rating.toFixed(1)}</span>
            </span>
          )}
          {app.popularity_score !== undefined && app.popularity_score > 50 && (
            <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
              Popular
            </span>
          )}
          {freshness === 'new' && (
            <Badge variant="default" className="text-xs px-2 py-0.5 bg-green-100 text-green-800 border-green-200">
              New
            </Badge>
          )}
          {app.website_url && (
            <a
              href={app.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors text-xs font-medium"
              title={`Visit ${app.website_url}`}
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[100px]">
                {app.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').split('/')[0]}
              </span>
            </a>
          )}
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {displayCategory}
          </Badge>
          {app.requires_auth && (
            <Badge
              variant={isAuthenticated ? "default" : "outline"}
              className={`text-xs px-2 py-0.5 ${isAuthenticated ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
            >
              {isAuthenticated
                ? 'Connected'
                : app.auth_schemes?.includes('OAUTH2')
                  ? 'OAuth'
                  : 'API Key'
              }
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {installError && (
            <span className="text-xs text-red-600 hidden sm:inline">Error</span>
          )}
          {isAuthenticated && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                setShowSettingsDialog(true)
              }}
              size="sm"
              variant="outline"
              aria-label={`Settings for ${app.name}`}
              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button
            onClick={handleInstallClick}
            disabled={buttonState.disabled}
            variant={buttonState.variant}
            size="sm"
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          >
            {buttonState.text}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-card group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 p-3 sm:p-4 lg:p-5 h-full flex flex-col">
      <div
        className="block cursor-pointer flex-1"
        onClick={() => setShowDetailsModal(true)}
      >
        {/* Header with icon, title, and status */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-gray-100 flex-shrink-0 relative p-1">
              <img
                src={appIcon}
                alt={`${app.name} icon`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => handleLogoError(e, `grid-${app.slug}`)}
              />
              {logoQuality === 'high' && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"
                     title="High quality logo" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base line-clamp-1">
                {app.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-0.5 leading-snug">
                {app.description}
              </p>
            </div>
          </div>
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${isInstalled ? 'bg-green-400' : 'bg-gray-300'}`}></div>
        </div>

        {/* Metadata section */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-2">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-1">
            {app.tool_count !== undefined && app.tool_count > 0 && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatToolCount(app.tool_count)}
              </span>
            )}
            {app.rating !== undefined && app.rating !== null && app.rating > 0 && (
              <span className="flex items-center space-x-1 whitespace-nowrap">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <span className="text-xs">{app.rating.toFixed(1)}</span>
              </span>
            )}
            {app.popularity_score !== undefined && app.popularity_score > 50 && (
              <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                Popular
              </span>
            )}
          </div>
          {app.website_url && (
            <a
              href={app.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors text-xs truncate max-w-[140px] font-medium"
              title={`Visit ${app.website_url}`}
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {app.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').split('/')[0]}
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom section with badges and actions */}
      <div className="mt-auto pt-2 sm:pt-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {displayCategory}
          </Badge>
          {app.requires_auth && (
            <Badge
              variant={isAuthenticated ? "default" : "outline"}
              className={`text-xs px-2 py-0.5 ${isAuthenticated ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
            >
              {isAuthenticated
                ? 'Connected'
                : app.auth_schemes?.includes('OAUTH2')
                  ? 'OAuth'
                  : 'API Key'
              }
            </Badge>
          )}
          {app.pricing && app.pricing !== 'free' && (
            <Badge variant="outline" className="text-xs capitalize px-2 py-0.5">
              {app.pricing}
            </Badge>
          )}
          {freshness === 'new' && (
            <Badge variant="default" className="text-xs px-2 py-0.5 bg-green-100 text-green-800 border-green-200">
              New
            </Badge>
          )}
          {appStats.complexity === 'enterprise' && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 border-purple-200 text-purple-700">
              Enterprise
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {installError && (
              <span className="text-xs text-red-600">Error</span>
            )}
            {isAuthenticated && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSettingsDialog(true)
                }}
                size="sm"
                variant="outline"
                aria-label={`Settings for ${app.name}`}
                className="h-8 w-8 p-0 sm:h-9 sm:w-9"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
          <Button
            onClick={handleInstallClick}
            disabled={buttonState.disabled}
            size="sm"
            variant={buttonState.variant}
            className="flex-1 max-w-[120px] text-xs sm:text-sm h-8 sm:h-9"
          >
            {buttonState.text}
          </Button>
        </div>
      </div>

      {/* OAuth Dialog */}
      {showOAuthDialog && (
        <OAuthDialog
          isOpen={showOAuthDialog}
          onClose={() => {
            setShowOAuthDialog(false)
            setOauthUrl(undefined)
          }}
          app={app}
          onAuthenticate={() => {
            // Refresh auth status after authentication
            refetchAuth()
          }}
          loading={authLoading}
          {...(oauthUrl && { redirectUrl: oauthUrl })}
          {...(currentWorkspace?.id && { workspaceId: currentWorkspace.id.toString() })}
        />
      )}

      {/* Settings Dialog */}
      {showSettingsDialog && isAuthenticated && (
        <AppSettingsDialog
          isOpen={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
          app={{
            id: app.slug,
            name: app.name,
            slug: app.slug,
            description: app.description || '',
            category: getCategoryDisplayName(app.category[0] || 'Other'),
            ...(app.website_url && { website: app.website_url })
          }}
          connection={{
            id: `conn_${app.slug}_${Date.now()}`,
            status: 'connected',
            connectedAt: new Date().toISOString(),
            authMethod: app.auth_schemes?.includes('OAUTH2') ? 'oauth' : 'api_key',
            ...(app.auth_schemes?.includes('OAUTH2') && { permissions: ['Read data', 'Write data'] }),
            ...(!app.auth_schemes?.includes('OAUTH2') && { apiKeyMasked: `${app.slug.substring(0, 3)}-${'•'.repeat(30)}` })
          }}
          onDisconnect={async () => {
            try {
              console.log('Disconnecting app:', app.name)
              // Call the disconnect API endpoint
              if (currentWorkspace?.id) {
                const response = await fetch(`/api/workspaces/${currentWorkspace.id}/tools/${app.slug}/disconnect`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                })

                if (response.ok) {
                  console.log('Successfully disconnected:', app.name)
                  refetchAuth()
                } else {
                  console.error('Failed to disconnect:', await response.text())
                }
              }
            } catch (error) {
              console.error('Error disconnecting app:', error)
            } finally {
              setShowSettingsDialog(false)
            }
          }}
          onRefresh={async () => {
            try {
              console.log('Refreshing connection for app:', app.name)
              // Call the refresh API endpoint
              if (currentWorkspace?.id) {
                const response = await fetch(`/api/workspaces/${currentWorkspace.id}/tools/${app.slug}/refresh`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                })

                if (response.ok) {
                  console.log('Successfully refreshed connection:', app.name)
                } else {
                  console.error('Failed to refresh connection:', await response.text())
                }
              }
              // Always refetch auth status after refresh attempt
              refetchAuth()
            } catch (error) {
              console.error('Error refreshing connection:', error)
              // Still refetch to get current status
              refetchAuth()
            }
          }}
          {...(!app.auth_schemes?.includes('OAUTH2') && {
            onUpdateApiKey: async (apiKey: string) => {
              try {
                console.log('Updating API key for app:', app.name, 'New key:', apiKey.substring(0, 5) + '...')
                // Call the update API key endpoint
                if (currentWorkspace?.id) {
                  const response = await fetch(`/api/workspaces/${currentWorkspace.id}/tools/${app.slug}/api-key`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ apiKey })
                  })

                  if (response.ok) {
                    console.log('Successfully updated API key:', app.name)
                    refetchAuth()
                  } else {
                    console.error('Failed to update API key:', await response.text())
                    throw new Error('Failed to update API key')
                  }
                }
              } catch (error) {
                console.error('Error updating API key:', error)
                throw error // Re-throw so the dialog can handle the error
              }
            }
          })}
        />
      )}

      {/* App Details Modal */}
      <AppDetailsModal
        app={app}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        installationStatus={null}
        onInstall={(installedApp) => {
          console.log('App installed:', installedApp.name)
          refetchAuth()
        }}
        onUninstall={(uninstalledApp) => {
          console.log('App uninstalled:', uninstalledApp.name)
          refetchAuth()
        }}
      />
    </div>
  )
}

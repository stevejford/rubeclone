'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useWorkspace } from '@/lib/hooks/use-workspace'
import { MainNav } from '@/components/navigation/main-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Icons } from '@/components/icons'
import { AppSettingsDialog } from '@/components/marketplace/app-settings-dialog'
import { AppDetailsModal } from '@/components/marketplace/app-details-modal'
import {
  Settings,
  Trash2,
  // ExternalLink,
  RefreshCw,
  Plus,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface ConnectedApp {
  id: string
  name: string
  slug: string
  description: string
  category: string
  status: 'connected' | 'error' | 'disconnected'
  connectedAt: string
  lastUsed?: string
  connectionId?: string
  authMethod?: 'oauth' | 'api_key'
  permissions?: string[]
  apiKeyMasked?: string
  website?: string
}

export default function ConnectedAppsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settingsApp, setSettingsApp] = useState<ConnectedApp | null>(null)
  const [detailsApp, setDetailsApp] = useState<ConnectedApp | null>(null)

  useEffect(() => {
    if (user && currentWorkspace) {
      fetchConnectedApps()
    }
  }, [user, currentWorkspace])

  const fetchConnectedApps = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual API call to get connected apps
      // For now, we'll simulate some connected apps
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockConnectedApps: ConnectedApp[] = [
        {
          id: '1',
          name: 'Gmail',
          slug: 'gmail',
          description: 'Email management and automation',
          category: 'Communication',
          status: 'connected',
          connectedAt: '2024-01-15T10:30:00Z',
          lastUsed: '2024-01-20T14:22:00Z',
          connectionId: 'conn_gmail_123',
          authMethod: 'oauth',
          permissions: ['Read emails', 'Send emails', 'Manage labels'],
          website: 'https://gmail.com'
        },
        {
          id: '2',
          name: 'Firecrawl',
          slug: 'firecrawl',
          description: 'Web scraping and data extraction',
          category: 'Data',
          status: 'connected',
          connectedAt: '2024-01-18T16:45:00Z',
          lastUsed: '2024-01-19T09:15:00Z',
          connectionId: 'conn_firecrawl_456',
          authMethod: 'api_key',
          apiKeyMasked: 'fc-••••••••••••••••••••••••••••••••',
          website: 'https://firecrawl.dev'
        }
      ]
      
      setConnectedApps(mockConnectedApps)
    } catch (err) {
      console.error('Failed to fetch connected apps:', err)
      setError('Failed to load connected apps')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (appId: string) => {
    try {
      // TODO: Implement disconnect API call
      console.log('Disconnecting app:', appId)
      
      // Remove from local state for now
      setConnectedApps(prev => prev.filter(app => app.id !== appId))
    } catch (err) {
      console.error('Failed to disconnect app:', err)
    }
  }

  const handleRefresh = async (appId: string) => {
    try {
      // TODO: Implement refresh connection API call
      console.log('Refreshing connection for app:', appId)

      // Update status in local state for now
      setConnectedApps(prev => prev.map(app =>
        app.id === appId
          ? { ...app, status: 'connected' as const, lastUsed: new Date().toISOString() }
          : app
      ))
    } catch (err) {
      console.error('Failed to refresh connection:', err)
    }
  }

  const handleOpenSettings = (app: ConnectedApp) => {
    setSettingsApp(app)
  }

  const handleUpdateApiKey = async (apiKey: string) => {
    if (!settingsApp) return

    try {
      // TODO: Implement API key update API call
      console.log('Updating API key for app:', settingsApp.id)

      // Update in local state for now
      setConnectedApps(prev => prev.map(app =>
        app.id === settingsApp.id
          ? { ...app, apiKeyMasked: `${apiKey.substring(0, 3)}-${'•'.repeat(30)}` }
          : app
      ))

      // Update settings dialog state
      setSettingsApp(prev => prev ? {
        ...prev,
        apiKeyMasked: `${apiKey.substring(0, 3)}-${'•'.repeat(30)}`
      } : null)
    } catch (err) {
      console.error('Failed to update API key:', err)
      throw err
    }
  }

  const getStatusIcon = (status: ConnectedApp['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: ConnectedApp['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'disconnected':
        return <Badge variant="secondary">Disconnected</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav variant="dashboard" />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav variant="dashboard" />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to view your connected apps.</p>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav variant="dashboard" />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Connected Apps</h1>
            <p className="text-gray-600 mt-2">
              Manage your connected tools and integrations
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={fetchConnectedApps} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/marketplace">
                <Plus className="h-4 w-4 mr-2" />
                Connect New App
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Connected</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedApps.length}</div>
              <p className="text-xs text-muted-foreground">
                Active integrations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {connectedApps.filter(app => app.status === 'connected').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Working properly
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {connectedApps.filter(app => app.status === 'error').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Require action
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Connected Apps List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Apps</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchConnectedApps}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : connectedApps.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Connected Apps</h3>
                <p className="text-gray-600 mb-4">
                  Connect your first app to start automating your workflows
                </p>
                <Button asChild>
                  <Link href="/marketplace">
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Marketplace
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {connectedApps.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-4 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                      onClick={() => setDetailsApp(app)}
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-semibold text-lg">
                          {app.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg hover:text-primary transition-colors">{app.name}</CardTitle>
                          {getStatusIcon(app.status)}
                          {getStatusBadge(app.status)}
                        </div>
                        <CardDescription className="mt-1">
                          {app.description}
                        </CardDescription>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Category: {app.category}</span>
                          <Separator orientation="vertical" className="h-4" />
                          <span>Connected: {formatDate(app.connectedAt)}</span>
                          {app.lastUsed && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <span>Last used: {formatDate(app.lastUsed)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRefresh(app.id)
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenSettings(app)
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDisconnect(app.id)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Settings Dialog */}
        {settingsApp && (
          <AppSettingsDialog
            isOpen={!!settingsApp}
            onClose={() => setSettingsApp(null)}
            app={{
              id: settingsApp.id,
              name: settingsApp.name,
              slug: settingsApp.slug,
              description: settingsApp.description,
              category: settingsApp.category,
              ...(settingsApp.website && { website: settingsApp.website })
            }}
            connection={{
              id: settingsApp.connectionId || '',
              status: settingsApp.status,
              connectedAt: settingsApp.connectedAt,
              authMethod: settingsApp.authMethod || 'api_key',
              ...(settingsApp.lastUsed && { lastUsed: settingsApp.lastUsed }),
              ...(settingsApp.permissions && { permissions: settingsApp.permissions }),
              ...(settingsApp.apiKeyMasked && { apiKeyMasked: settingsApp.apiKeyMasked })
            }}
            onDisconnect={() => handleDisconnect(settingsApp.id)}
            onRefresh={() => handleRefresh(settingsApp.id)}
            {...(settingsApp.authMethod === 'api_key' && { onUpdateApiKey: handleUpdateApiKey })}
          />
        )}

        {/* App Details Modal */}
        <AppDetailsModal
          app={detailsApp ? {
            slug: detailsApp.slug,
            name: detailsApp.name,
            description: detailsApp.description,
            category: [detailsApp.category], // Convert string to array
            requires_auth: true,
            auth_schemes: detailsApp.authMethod === 'oauth' ? ['OAUTH2'] : ['API_KEY'],
            pricing: 'free',
            logo: undefined,
            rating: 4.5,
            review_count: 100,
            tool_count: 10,
            ...(detailsApp.website && { website_url: detailsApp.website })
          } : null}
          isOpen={!!detailsApp}
          onClose={() => setDetailsApp(null)}
          installationStatus={null}
          onInstall={(installedApp) => {
            console.log('App installed:', installedApp.name)
            setDetailsApp(null)
          }}
          onUninstall={(uninstalledApp) => {
            console.log('App uninstalled:', uninstalledApp.name)
            setDetailsApp(null)
          }}
        />
      </div>
    </div>
  )
}

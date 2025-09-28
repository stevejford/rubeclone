'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/icons'
import {
  Settings,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Key,
  Calendar,
  Activity,
  Info,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'

interface AppSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  app: {
    id: string
    name: string
    slug: string
    description: string
    category: string
    logo?: string
    website?: string
  }
  connection?: {
    id: string
    status: 'connected' | 'error' | 'disconnected'
    connectedAt: string
    lastUsed?: string
    authMethod: 'oauth' | 'api_key'
    permissions?: string[]
    apiKeyMasked?: string
  }
  onDisconnect: () => void
  onRefresh: () => void
  onUpdateApiKey?: (apiKey: string) => void
}

export function AppSettingsDialog({
  isOpen,
  onClose,
  app,
  connection,
  onDisconnect,
  onRefresh,
  onUpdateApiKey
}: AppSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'auth' | 'permissions' | 'advanced'>('overview')
  const [newApiKey, setNewApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleUpdateApiKey = async () => {
    if (!newApiKey.trim() || !onUpdateApiKey) return

    setIsUpdating(true)
    try {
      await onUpdateApiKey(newApiKey.trim())
      setNewApiKey('')
      setShowApiKey(false)
    } catch (error) {
      console.error('Failed to update API key:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      await onDisconnect()
      onClose()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('Failed to refresh connection:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const copyConnectionId = () => {
    if (connection?.id) {
      navigator.clipboard.writeText(connection.id)
    }
  }

  const getStatusBadge = () => {
    if (!connection) return null
    
    switch (connection.status) {
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'auth', label: 'Authentication', icon: Key },
    { id: 'permissions', label: 'Permissions', icon: Settings },
    { id: 'advanced', label: 'Advanced', icon: Activity }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary font-semibold text-lg">
                {app.name.charAt(0)}
              </span>
            </div>
            <div>
              <DialogTitle className="text-xl">{app.name} Settings</DialogTitle>
              <DialogDescription>
                Manage your {app.name} integration and connection settings
              </DialogDescription>
            </div>
            <div className="ml-auto">
              {getStatusBadge()}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r pr-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 pl-6 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Connection Overview</h3>
                  
                  {connection ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-2">
                            {connection.status === 'connected' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="capitalize">{connection.status}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Connected</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{formatDate(connection.connectedAt)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {connection.lastUsed && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Last Used</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{formatDate(connection.lastUsed)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Connection ID</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {connection.id}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={copyConnectionId}
                              className="h-6 w-6 p-0"
                              aria-label="Copy connection ID"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This app is not currently connected. Connect it from the marketplace to manage settings.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">App Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-gray-600 mt-1">{app.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm text-gray-600 mt-1">{app.category}</p>
                    </div>
                    {app.website && (
                      <div>
                        <Label className="text-sm font-medium">Website</Label>
                        <a
                          href={app.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-1 flex items-center space-x-1"
                        >
                          <span>{app.website}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Authentication</h3>
                  
                  {connection ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Authentication Method</Label>
                        <p className="text-sm text-gray-600 mt-1 capitalize">
                          {connection.authMethod === 'oauth' ? 'OAuth 2.0' : 'API Key'}
                        </p>
                      </div>

                      {connection.authMethod === 'api_key' && onUpdateApiKey && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">API Key</Label>
                          {connection.apiKeyMasked && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>Current: {connection.apiKeyMasked}</span>
                            </div>
                          )}
                          
                          <div className="flex space-x-2">
                            <div className="relative flex-1">
                              <Input
                                type={showApiKey ? 'text' : 'password'}
                                placeholder="Enter new API key"
                                value={newApiKey}
                                onChange={(e) => setNewApiKey(e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowApiKey(!showApiKey)}
                                aria-label={showApiKey ? "Hide API key" : "Show API key"}
                              >
                                {showApiKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <Button
                              onClick={handleUpdateApiKey}
                              disabled={!newApiKey.trim() || isUpdating}
                            >
                              {isUpdating && <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />}
                              Update
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                        >
                          {isRefreshing ? (
                            <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Refresh Connection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Connect this app first to manage authentication settings.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                  
                  {connection?.permissions && connection.permissions.length > 0 ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Granted Permissions</Label>
                      <div className="space-y-2">
                        {connection.permissions.map((permission, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No specific permissions information available for this connection.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
                  
                  <div className="space-y-4">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Danger Zone:</strong> These actions cannot be undone.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-red-600">Disconnect App</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Remove this connection and revoke all permissions. You'll need to reconnect to use this app again.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={handleDisconnect}
                          disabled={isDisconnecting || !connection}
                          className="mt-2"
                        >
                          {isDisconnecting ? (
                            <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Disconnect {app.name}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExternalLink, Key, Shield, CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react'
import { RealMarketplaceApp } from '@/types/marketplace'

interface OAuthDialogProps {
  isOpen: boolean
  onClose: () => void
  app: RealMarketplaceApp
  redirectUrl?: string
  onAuthenticate: () => void
  loading?: boolean
  workspaceId?: string
}

export function OAuthDialog({
  isOpen,
  onClose,
  app,
  redirectUrl,
  onAuthenticate,
  loading = false,
  workspaceId
}: OAuthDialogProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isTestingApiKey, setIsTestingApiKey] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Determine authentication methods from app auth schemes (Composio API uses uppercase)
  const supportsOAuth = app.auth_schemes?.includes('OAUTH2')
  const supportsApiKey = app.auth_schemes?.includes('API_KEY')
  const supportsBearer = app.auth_schemes?.includes('BEARER_TOKEN')
  const supportsServiceAccount = app.auth_schemes?.includes('SERVICE_ACCOUNT')
  const supportsNoAuth = app.auth_schemes?.includes('NO_AUTH')
  
  // For debugging
  console.log('🔐 App auth schemes:', app.auth_schemes)
  console.log('🔐 Supports OAuth:', supportsOAuth)
  console.log('🔐 Supports API Key:', supportsApiKey)
  console.log('🔐 Redirect URL:', redirectUrl)

  const handleOAuthAuthenticate = async () => {
    if (!redirectUrl) {
      setErrorMessage('OAuth URL not available. Please try again.')
      return
    }

    setIsAuthenticating(true)
    setErrorMessage('')
    
    try {
      // Open OAuth URL in new window
      const authWindow = window.open(
        redirectUrl, 
        'oauth-auth', 
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )
      
      if (!authWindow) {
        throw new Error('Failed to open authentication window. Please allow popups and try again.')
      }

      // Listen for postMessage from callback window
      const handleMessage = (event: MessageEvent) => {
        // Validate origin for security
        const expectedOrigin = window.location.origin
        if (event.origin !== expectedOrigin) {
          console.warn('Received message from unexpected origin:', event.origin)
          return
        }

        if (event.data.type === 'composio-auth-success') {
          console.log('✅ OAuth authentication successful')
          cleanup()
          setIsAuthenticating(false)
          onAuthenticate() // Refresh the connection status
          onClose() // Close the dialog
        } else if (event.data.type === 'composio-auth-error') {
          console.error('❌ OAuth authentication failed:', event.data.error)
          cleanup()
          setIsAuthenticating(false)
          setErrorMessage(event.data.error || 'Authentication failed')
        }
      }

      const cleanup = () => {
        window.removeEventListener('message', handleMessage)
        clearTimeout(timeoutId)
      }

      window.addEventListener('message', handleMessage)
      
      // Timeout fallback in case the window doesn't send a message
      const timeoutId = setTimeout(() => {
        console.log('⏰ OAuth timeout - no response received')
        cleanup()
        setIsAuthenticating(false)
        setErrorMessage('Authentication timed out. Please try again.')
      }, 300000) // 5 minutes timeout
      
      // Note: Removed authWindow.focus() due to COOP policy blocking it
    } catch (error) {
      console.error('Authentication error:', error)
      setIsAuthenticating(false)
      setErrorMessage('Failed to open authentication window')
    }
  }

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setErrorMessage('Please enter an API key')
      return
    }

    setIsTestingApiKey(true)
    setApiKeyStatus('testing')
    setErrorMessage('')

    try {
      const response = await fetch('/api/composio/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolkit: app.slug,
          apiKey: apiKey.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setApiKeyStatus('valid')
        console.log('✅ API key is valid')
      } else {
        setApiKeyStatus('invalid')
        setErrorMessage(result.error || 'Invalid API key')
        console.log('❌ API key is invalid:', result.error)
      }
    } catch (error) {
      console.error('API key test error:', error)
      setApiKeyStatus('invalid')
      setErrorMessage('Failed to test API key')
    }

    setIsTestingApiKey(false)
  }

  const connectWithApiKey = async () => {
    if (!apiKey.trim() || apiKeyStatus !== 'valid') {
      setErrorMessage('Please test and validate your API key first')
      return
    }

    setIsAuthenticating(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/composio/connect-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolkit: app.slug,
          apiKey: apiKey.trim(),
          workspaceId: workspaceId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ API key connection successful')
        onAuthenticate()
        onClose()
      } else {
        setErrorMessage(result.error || 'Failed to connect with API key')
        console.log('❌ API key connection failed:', result.error)
      }
    } catch (error) {
      console.error('API key connection error:', error)
      setErrorMessage('Failed to connect with API key')
    }

    setIsAuthenticating(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            Connect to {app.name}
          </DialogTitle>
          <DialogDescription>
            Authenticate with {app.name} to enable AI tool integration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Authentication Methods Available */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Available Authentication Methods:</span>
            </div>
            <div className="flex flex-wrap gap-2 ml-6">
              {supportsOAuth && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  OAuth 2.0
                </Badge>
              )}
              {(supportsApiKey || supportsBearer) && (
                <Badge variant="secondary" className="text-xs">
                  <Key className="w-3 h-3 mr-1" />
                  API Key
                </Badge>
              )}
            </div>
          </div>

          {/* OAuth Flow - Only show if OAuth is supported and redirectUrl exists */}
          {supportsOAuth && redirectUrl && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    OAuth Authentication Ready
                  </p>
                  <p className="text-xs text-blue-700">
                    Click "Authenticate with OAuth" to open {app.name}'s authorization page in a new window.
                    After granting permissions, the window will close automatically.
                  </p>
                  <Button
                    onClick={handleOAuthAuthenticate}
                    disabled={isAuthenticating || loading}
                    className="w-full mt-3"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Authenticate with OAuth
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* API Key Flow - Show if API Key is supported */}
          {(supportsApiKey || supportsBearer) && (
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-3 flex-1">
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      API Key Authentication
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Visit{' '}
                      <a
                        href={app.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {app.name}'s website
                      </a>{' '}
                      to generate your API key.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-sm">
                      API Key
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your API key..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value)
                        setApiKeyStatus('idle')
                        setErrorMessage('')
                      }}
                      className="font-mono text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={testApiKey}
                        disabled={!apiKey.trim() || isTestingApiKey}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        {isTestingApiKey ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test API Key'
                        )}
                      </Button>
                      
                      {apiKeyStatus === 'valid' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-xs">Valid</span>
                        </div>
                      )}
                      
                      {apiKeyStatus === 'invalid' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs">Invalid</span>
                        </div>
                      )}
                    </div>
                    
                    {apiKeyStatus === 'valid' && (
                      <Button
                        onClick={connectWithApiKey}
                        disabled={isAuthenticating}
                        className="w-full mt-2"
                        size="sm"
                      >
                        {isAuthenticating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect with API Key'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No OAuth URL Available - Show if OAuth is supported but no redirectUrl */}
          {supportsOAuth && !redirectUrl && (
            <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    OAuth Setup Required
                  </p>
                  <p className="text-xs text-gray-600">
                    OAuth authentication is being prepared. Please close this dialog and try again in a moment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* No Authentication Methods */}
          {!supportsOAuth && !supportsApiKey && !supportsBearer && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Authentication Method Unknown
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Please contact support for assistance with {app.name} authentication.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAuthenticating}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
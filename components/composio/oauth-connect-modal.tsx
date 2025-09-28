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
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OAuthConnectModalProps {
  isOpen: boolean
  onClose: () => void
  toolkit: string
  toolkitDisplayName?: string
  toolkitDescription?: string
  toolkitCategory?: string
  onConnect: () => void
  isConnecting?: boolean
  error?: string | null
}

// Toolkit-specific information following Composio's multi-tenant architecture
const TOOLKIT_INFO: Record<string, {
  displayName: string
  description: string
  category: string
  permissions: string[]
  benefits: string[]
  icon?: string
  color?: string
  authScopes?: string[]
  privacyNotice?: string
}> = {
  gmail: {
    displayName: 'Gmail',
    description: 'Connect your Gmail account through Composio\'s secure OAuth integration.',
    category: 'Communication',
    permissions: [
      'Send emails on your behalf',
      'Read your email messages',
      'Access email labels and filters',
      'Manage email attachments'
    ],
    benefits: [
      'Send emails directly from AI agents',
      'Read and analyze email content',
      'Automate email workflows',
      'Access Gmail labels and filters'
    ],
    color: 'bg-red-500',
    authScopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    privacyNotice: 'Your Gmail credentials are securely stored by Composio and never shared with third parties.'
  },
  slack: {
    displayName: 'Slack',
    description: 'Connect your Slack workspace to send messages, manage channels, and automate workflows.',
    category: 'Communication',
    permissions: [
      'Send and read messages',
      'Access channel information',
      'Manage workspace settings',
      'Upload and download files'
    ],
    benefits: [
      'Automated notifications',
      'Smart message routing',
      'Team collaboration tools',
      'Workflow automation'
    ],
    color: 'bg-purple-500',
  },
  github: {
    displayName: 'GitHub',
    description: 'Connect your GitHub account through Composio\'s secure OAuth integration.',
    category: 'Development',
    permissions: [
      'Create and manage repositories',
      'Automate pull requests and issues',
      'Access repository analytics',
      'Manage team permissions'
    ],
    benefits: [
      'Create and manage repositories',
      'Automate pull requests and issues',
      'Access repository analytics',
      'Manage team permissions'
    ],
    color: 'bg-gray-800',
    authScopes: ['repo', 'user:email', 'read:org'],
    privacyNotice: 'Your GitHub credentials are securely managed by Composio with enterprise-grade security.'
  },
  // Add more toolkits as needed
}

export function OAuthConnectModal({
  isOpen,
  onClose,
  toolkit,
  toolkitDisplayName,
  toolkitDescription,
  toolkitCategory,
  onConnect,
  isConnecting = false,
  error = null,
}: OAuthConnectModalProps) {
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false)
  
  // Get toolkit information
  const toolkitInfo = TOOLKIT_INFO[toolkit.toLowerCase()] || {
    displayName: toolkitDisplayName || toolkit,
    description: toolkitDescription || `Connect your ${toolkit} account to enable integration.`,
    category: toolkitCategory || 'Integration',
    permissions: ['Access account information', 'Perform authorized actions'],
    benefits: ['Seamless integration', 'Automated workflows'],
  }

  const handleConnect = () => {
    if (!hasReadPrivacy) {
      setHasReadPrivacy(true)
      return
    }
    onConnect()
  }

  const handleClose = () => {
    if (!isConnecting) {
      onClose()
      setHasReadPrivacy(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {toolkitInfo.color && (
              <div className={`w-10 h-10 rounded-lg ${toolkitInfo.color} flex items-center justify-center text-white font-bold text-lg`}>
                {toolkitInfo.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <DialogTitle className="flex items-center gap-2">
                Connect {toolkitInfo.displayName}
                <Badge variant="outline">{toolkitInfo.category}</Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {toolkitInfo.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Benefits Section */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              What you can do
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {toolkitInfo.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Permissions Section */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Permissions Required
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {toolkitInfo.permissions.map((permission, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {permission}
                </li>
              ))}
            </ul>
          </div>

          {/* Composio Privacy Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Powered by Composio:</strong> {toolkitInfo.privacyNotice || 'Your credentials are securely managed by Composio with enterprise-grade security.'}
              <br />
              <strong>Multi-tenant Architecture:</strong> Your connections are completely isolated from other users.
              You can disconnect at any time from your workspace settings.
            </AlertDescription>
          </Alert>

          {/* Auth Scopes Information */}
          {toolkitInfo.authScopes && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                OAuth Scopes
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                {toolkitInfo.authScopes.map((scope, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-amber-500" />
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">{scope}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms Acknowledgment */}
          {!hasReadPrivacy && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                By connecting {toolkitInfo.displayName}, you acknowledge that you have read and 
                understand the permissions and privacy information above.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isConnecting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full sm:w-auto"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : hasReadPrivacy ? (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Account
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                I Understand
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Simplified version for quick connections
export function QuickConnectModal({
  isOpen,
  onClose,
  toolkit,
  onConnect,
  isConnecting = false,
}: {
  isOpen: boolean
  onClose: () => void
  toolkit: string
  onConnect: () => void
  isConnecting?: boolean
}) {
  const toolkitInfo = TOOLKIT_INFO[toolkit.toLowerCase()] || {
    displayName: toolkit,
    description: `Connect your ${toolkit} account`,
    category: 'Integration',
    permissions: [],
    benefits: [],
    color: 'bg-gray-500',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Connect {toolkitInfo.displayName}</DialogTitle>
          <DialogDescription>
            {toolkitInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-6">
          {toolkitInfo.color && (
            <div className={`w-16 h-16 rounded-full ${toolkitInfo.color} flex items-center justify-center text-white font-bold text-2xl`}>
              {toolkitInfo.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConnecting}>
            Cancel
          </Button>
          <Button onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

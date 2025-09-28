'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Unplug,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ConnectionStatus } from '@/lib/validations/composio'

interface ConnectionStatusProps {
  toolkit: string
  status: ConnectionStatus
  onReconnect?: () => void
  onDisconnect?: () => void
  isReconnecting?: boolean
  isDisconnecting?: boolean
  canManage?: boolean
  className?: string
}

export function ConnectionStatus({
  toolkit,
  status,
  onReconnect,
  onDisconnect,
  isReconnecting = false,
  isDisconnecting = false,
  canManage = false,
  className = '',
}: ConnectionStatusProps) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'expired':
        return <Clock className="h-4 w-4 text-orange-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    switch (status.status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Connected
          </Badge>
        )
      case 'disconnected':
        return (
          <Badge variant="secondary">
            Disconnected
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            Error
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="outline" className="border-orange-200 text-orange-800">
            Expired
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            Unknown
          </Badge>
        )
    }
  }

  const getStatusMessage = () => {
    switch (status.status) {
      case 'connected':
        return 'Successfully connected and ready to use'
      case 'disconnected':
        return 'Not connected. Click connect to authorize access.'
      case 'error':
        return 'Connection error. Please try reconnecting.'
      case 'expired':
        return 'Connection expired. Please reconnect to continue using this tool.'
      default:
        return 'Connection status unknown'
    }
  }

  const formatLastSync = (lastSync?: Date) => {
    if (!lastSync) return null
    
    try {
      return formatDistanceToNow(lastSync, { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">{toolkit}</span>
          {getStatusBadge()}
        </div>
        
        {canManage && (
          <div className="flex items-center gap-2">
            {status.status === 'connected' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDisconnect}
                disabled={isDisconnecting}
                className="h-8"
              >
                {isDisconnecting ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unplug className="h-3 w-3 mr-1" />
                    Disconnect
                  </>
                )}
              </Button>
            )}
            
            {(status.status === 'disconnected' || status.status === 'error' || status.status === 'expired') && (
              <Button
                variant="default"
                size="sm"
                onClick={onReconnect}
                disabled={isReconnecting}
                className="h-8"
              >
                {isReconnecting ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {status.status === 'disconnected' ? 'Connect' : 'Reconnect'}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Status Details */}
      <div className="text-sm text-muted-foreground">
        <p>{getStatusMessage()}</p>
        
        {/* Connection Details */}
        {status.isConnected && (
          <div className="mt-2 space-y-1">
            {status.connectedAccount && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span className="text-xs">Connected as: {status.connectedAccount}</span>
              </div>
            )}
            
            {status.lastSync && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Last sync: {formatLastSync(status.lastSync)}</span>
              </div>
            )}
            
            {status.connectionId && (
              <div className="text-xs text-muted-foreground/70">
                Connection ID: {status.connectionId.slice(0, 8)}...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Health Indicator */}
      {status.isConnected && (
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground">Active</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Simplified version for compact display
export function ConnectionStatusBadge({ 
  status, 
  showIcon = true 
}: { 
  status: ConnectionStatus
  showIcon?: boolean 
}) {
  const getIcon = () => {
    if (!showIcon) return null
    
    switch (status.status) {
      case 'connected':
        return <CheckCircle className="h-3 w-3" />
      case 'disconnected':
        return <XCircle className="h-3 w-3" />
      case 'error':
        return <AlertCircle className="h-3 w-3" />
      case 'expired':
        return <Clock className="h-3 w-3" />
      default:
        return <XCircle className="h-3 w-3" />
    }
  }

  const getBadgeVariant = () => {
    switch (status.status) {
      case 'connected':
        return 'default' as const
      case 'error':
        return 'destructive' as const
      case 'expired':
        return 'outline' as const
      default:
        return 'secondary' as const
    }
  }

  const getBadgeClassName = () => {
    switch (status.status) {
      case 'connected':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'expired':
        return 'border-orange-200 text-orange-800'
      default:
        return ''
    }
  }

  return (
    <Badge 
      variant={getBadgeVariant()} 
      className={`flex items-center gap-1 ${getBadgeClassName()}`}
    >
      {getIcon()}
      <span className="capitalize">{status.status}</span>
    </Badge>
  )
}

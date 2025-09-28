import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
// SWR imports removed as they're not currently used in this implementation
import { useWorkspace, useWorkspaceTools } from './use-workspace'
import type { 
  ConnectionInitiateRequest, 
  ConnectionDisconnectRequest,
  ConnectionStatus,
  ToolExecutionRequest,
  ToolExecutionResponse 
} from '@/lib/validations/composio'

/**
 * Custom React hook for managing Composio connections in the frontend
 * Provides state management for connection status, OAuth flows, and error handling
 */

interface UseComposioConnectionOptions {
  workspaceId?: string
  toolkit?: string
  onConnectionSuccess?: (toolkit: string) => void
  onConnectionError?: (error: string) => void
  onDisconnectSuccess?: (toolkit: string) => void
  onDisconnectError?: (error: string) => void
}

interface ComposioConnectionState {
  isConnecting: boolean
  isDisconnecting: boolean
  isExecuting: boolean
  connectionStatus: ConnectionStatus | null
  error: string | null
}

export function useComposioConnection(options: UseComposioConnectionOptions = {}) {
  const { workspaceId, toolkit, onConnectionSuccess, onConnectionError, onDisconnectSuccess, onDisconnectError } = options
  // Suppress unused parameter warnings
  void toolkit; void onConnectionSuccess;
  const router = useRouter()
  const { currentWorkspace, permissions } = useWorkspace()
  const { tools, isLoading: toolsLoading, error: toolsError, refreshTools } = useWorkspaceTools(workspaceId || '')
  // Suppress unused variable warnings
  void router; void currentWorkspace; void toolsError;

  // Local state for connection operations
  const [state, setState] = useState<ComposioConnectionState>({
    isConnecting: false,
    isDisconnecting: false,
    isExecuting: false,
    connectionStatus: null,
    error: null,
  })

  // Get connection status for a specific toolkit
  const getConnectionStatus = useCallback((toolkitName: string): ConnectionStatus | null => {
    if (!tools) return null

    const tool = tools.find((t: any) => t.tool_slug === toolkitName || t.toolSlug === toolkitName)
    if (!tool) return { isConnected: false, status: 'disconnected' }

    const config = tool.config || {}
    return {
      isConnected: tool.is_enabled && !!(tool as any).connection_id,
      connectionId: (tool as any).connection_id,
      connectedAccount: config.connectedAccount,
      lastSync: config.lastSync ? new Date(config.lastSync) : undefined,
      status: config.connectionStatus || (tool.is_enabled ? 'connected' : 'disconnected'),
    }
  }, [tools])

  // Initiate OAuth connection
  const initiateConnection = useCallback(async (toolkitName: string) => {
    if (!workspaceId) {
      toast.error('Workspace ID is required')
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const request: ConnectionInitiateRequest = {
        workspaceId: parseInt(workspaceId),
        toolkit: toolkitName,
      }

      const response = await fetch('/api/composio/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate connection')
      }

      // Redirect to OAuth provider
      window.location.href = data.redirectUrl
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate connection'
      setState(prev => ({ ...prev, error: errorMessage, isConnecting: false }))
      toast.error(errorMessage)
      onConnectionError?.(errorMessage)
    }
  }, [workspaceId, onConnectionError])

  // Disconnect a toolkit
  const disconnectTool = useCallback(async (toolkitName: string) => {
    if (!workspaceId) {
      toast.error('Workspace ID is required')
      return
    }

    setState(prev => ({ ...prev, isDisconnecting: true, error: null }))

    try {
      const request: ConnectionDisconnectRequest = {
        workspaceId: parseInt(workspaceId),
        toolkit: toolkitName,
      }

      const response = await fetch('/api/composio/disconnect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect tool')
      }

      // Refresh tools data
      await refreshTools()

      toast.success(`Successfully disconnected ${toolkitName}`)
      onDisconnectSuccess?.(toolkitName)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect tool'
      setState(prev => ({ ...prev, error: errorMessage }))
      toast.error(errorMessage)
      onDisconnectError?.(errorMessage)
    } finally {
      setState(prev => ({ ...prev, isDisconnecting: false }))
    }
  }, [workspaceId, refreshTools, onDisconnectSuccess, onDisconnectError])

  // Execute a tool action
  const executeTool = useCallback(async (
    toolkitName: string, 
    action: string, 
    parameters: Record<string, any> = {}
  ): Promise<ToolExecutionResponse | null> => {
    if (!workspaceId) {
      toast.error('Workspace ID is required')
      return null
    }

    setState(prev => ({ ...prev, isExecuting: true, error: null }))

    try {
      const request: ToolExecutionRequest = {
        workspaceId: parseInt(workspaceId),
        toolSlug: toolkitName,
        action,
        parameters,
      }

      const response = await fetch('/api/composio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Tool execution failed')
      }

      if (data.success) {
        toast.success(`Successfully executed ${action}`)
        return data
      } else {
        throw new Error(data.error || 'Tool execution failed')
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tool execution failed'
      setState(prev => ({ ...prev, error: errorMessage }))
      toast.error(errorMessage)
      return null
    } finally {
      setState(prev => ({ ...prev, isExecuting: false }))
    }
  }, [workspaceId])

  // Check if user can manage connections (owner or admin)
  const canManageConnections = useCallback(() => {
    if (!permissions) return false

    // Check if user can manage tools (includes connection management)
    return permissions.canManageTools
  }, [permissions])

  // Refresh connection data
  const refreshConnections = useCallback(async () => {
    await refreshTools()
  }, [refreshTools])

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // State
    isConnecting: state.isConnecting,
    isDisconnecting: state.isDisconnecting,
    isExecuting: state.isExecuting,
    error: state.error,
    isLoading: toolsLoading,

    // Data
    tools: tools || [],
    
    // Functions
    getConnectionStatus,
    initiateConnection,
    disconnectTool,
    executeTool,
    canManageConnections,
    refreshConnections,
    clearError,
    
    // Utilities
    isToolConnected: (toolkitName: string) => {
      const status = getConnectionStatus(toolkitName)
      return status?.isConnected || false
    },
    
    isToolEnabled: (toolkitName: string) => {
      const tool = tools?.find((t: any) => t.tool_slug === toolkitName || t.toolSlug === toolkitName)
      return tool?.is_enabled || false
    },

    getToolConnectionId: (toolkitName: string) => {
      const tool = tools?.find((t: any) => t.tool_slug === toolkitName || t.toolSlug === toolkitName)
      return (tool as any)?.connection_id || null
    },
  }
}

import { useState, useCallback } from 'react'
import useSWR from 'swr'

export interface ToolAuthStatus {
  isConnected: boolean
  connectionId?: string
  connectedAccount?: string
  lastSync?: string
  status: 'connected' | 'disconnected' | 'error' | 'expired'
}

export interface UseToolAuthOptions {
  enabled?: boolean
  refreshInterval?: number
}

export interface UseToolAuthReturn {
  authStatus: ToolAuthStatus | null
  loading: boolean
  error: Error | null
  refetch: () => void
  initiateAuth: (source?: string) => Promise<{ redirectUrl?: string }>
}

const fetcher = async (url: string): Promise<ToolAuthStatus> => {
  const response = await fetch(url, {
    credentials: 'include', // Include cookies for authentication
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch auth status')
  }
  return result.data
}

export function useToolAuth(
  toolSlug: string,
  workspaceId: string,
  options: UseToolAuthOptions = {}
): UseToolAuthReturn {
  const { enabled = true, refreshInterval = 30000 } = options
  const [initiating, setInitiating] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<ToolAuthStatus>(
    enabled && toolSlug && workspaceId 
      ? `/api/workspaces/${workspaceId}/tools/${toolSlug}/auth-status` 
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: refreshInterval,
      dedupingInterval: 10000, // 10 seconds
      errorRetryCount: 3,
    }
  )

  const refetch = useCallback(() => {
    mutate()
  }, [mutate])

  const initiateAuth = useCallback(async (source: string = 'workspace'): Promise<{ redirectUrl?: string }> => {
    if (initiating) return {}

    setInitiating(true)
    try {
      const response = await fetch('/api/composio/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          toolkit: toolSlug,
          workspaceId: workspaceId,
          source: source, // Pass the source parameter
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate OAuth connection')
      }

      const result = await response.json()

      // Return the OAuth URL instead of auto-redirecting
      return {
        redirectUrl: result.redirectUrl
      }
    } catch (error) {
      console.error('Failed to initiate auth:', error)
      throw error
    } finally {
      setInitiating(false)
    }
  }, [toolSlug, workspaceId, initiating])

  return {
    authStatus: data || null,
    loading: isLoading || initiating,
    error: error || null,
    refetch,
    initiateAuth,
  }
}

export function useMultipleToolAuth(
  tools: Array<{ slug: string; workspaceId: string }>,
  options: UseToolAuthOptions = {}
): Record<string, UseToolAuthReturn> {
  const results: Record<string, UseToolAuthReturn> = {}
  
  for (const tool of tools) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[tool.slug] = useToolAuth(tool.slug, tool.workspaceId, options)
  }
  
  return results
}

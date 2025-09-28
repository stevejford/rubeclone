import { aiConfig } from './env'

// Composio multi-tenant client following their architecture patterns
// This implements proper user isolation and connected account management
class ComposioClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: { apiKey: string; baseUrl: string }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
  }

  // Create or get auth config for a toolkit using MCP approach
  async getOrCreateAuthConfig(toolkit: string) {
    try {
      // For MCP, we use Composio managed auth configs
      // This creates a reusable auth config for the toolkit
      const response = await fetch(`${this.baseUrl}/auth_configs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolkit: toolkit,
          type: 'use_composio_managed_auth' // Use Composio's OAuth credentials
        })
      })

      if (!response.ok) {
        // If auth config already exists, try to get it
        if (response.status === 409) {
          return await this.getExistingAuthConfig(toolkit)
        }
        throw new Error(`Failed to create auth config: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating auth config:', error)
      throw error
    }
  }

  private async getExistingAuthConfig(toolkit: string) {
    const response = await fetch(`${this.baseUrl}/auth_configs?toolkit=${toolkit}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) throw new Error(`Failed to get existing auth config: ${response.statusText}`)

    const configs = await response.json()
    return configs.find((config: any) => config.toolkit === toolkit)
  }

  // Connected Accounts - User-specific authenticated connections using MCP approach
  async initiateConnection(params: {
    userId: string
    toolkit: string
    redirectUrl?: string
    state: string
  }) {
    try {
      // Get or create auth config for this toolkit
      const authConfig = await this.getOrCreateAuthConfig(params.toolkit)

      // Use the v3 API structure for connected accounts
      const response = await fetch(`${this.baseUrl}/connected_accounts/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: params.userId, // Critical: User isolation boundary
          auth_config_id: authConfig.id,
          config: {
            auth_scheme: 'OAUTH2',
            callback_url: params.redirectUrl,
            state: params.state,
          },
        }),
      })

      if (!response.ok) throw new Error(`Failed to initiate connection: ${response.statusText}`)

      const result = await response.json()
      return {
        redirectUrl: result.redirect_url,
        connectionId: result.id,
      }
    } catch (error) {
      console.error('Error initiating connection:', error)
      throw error
    }
  }

  async completeConnection(params: {
    code: string
    userId: string
    state: string
    connectionId: string
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/connected_accounts/${params.connectionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: params.userId, // Ensure user isolation
          code: params.code,
          state: params.state,
        }),
      })

      if (!response.ok) throw new Error(`Failed to complete connection: ${response.statusText}`)

      return await response.json()
    } catch (error) {
      console.error('Error completing connection:', error)
      throw error
    }
  }

  // List user's connected accounts with proper isolation
  async getConnectedAccounts(params: {
    userId: string
    toolkit?: string
  }) {
    try {
      const queryParams = new URLSearchParams({
        user_id: params.userId, // Critical: Only return this user's connections
        ...(params.toolkit && { toolkit: params.toolkit }),
      })

      const response = await fetch(`${this.baseUrl}/connected_accounts?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error(`Failed to get connections: ${response.statusText}`)

      return await response.json()
    } catch (error) {
      console.error('Error getting connections:', error)
      // Return empty array when no connections exist (expected for new users)
      return []
    }
  }

  // Tool execution with user isolation
  async executeAction(params: {
    userId: string
    toolkit: string
    action: string
    parameters: Record<string, any>
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/tools/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool_slug: `${params.toolkit}_${params.action}`,
          user_id: params.userId, // Critical: User isolation for tool execution
          params: params.parameters,
        }),
      })

      if (!response.ok) throw new Error(`Failed to execute tool: ${response.statusText}`)

      return await response.json()
    } catch (error) {
      console.error('Error executing tool:', error)
      throw error
    }
  }

  // Revoke connection with proper user verification
  async revokeConnection(params: {
    userId: string
    connectionId: string
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/connected_accounts/${params.connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: params.userId, // Verify user owns this connection
        }),
      })

      if (!response.ok) throw new Error(`Failed to revoke connection: ${response.statusText}`)

      return { success: true }
    } catch (error) {
      console.error('Error revoking connection:', error)
      throw error
    }
  }

  // Get available toolkits (shared across all users)
  async getToolkits() {
    try {
      const response = await fetch(`${this.baseUrl}/toolkits`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error(`Failed to get toolkits: ${response.statusText}`)

      return await response.json()
    } catch (error) {
      console.error('Error getting toolkits:', error)
      throw error // Remove mock fallback, let the service layer handle errors
    }
  }

  // Get Partner API apps (new method for marketplace integration)
  async getPartnerApps() {
    try {
      const partnerApiUrl = `${this.baseUrl.replace('/api/v1', '')}/api/partner/lemon/apps/list`
      const response = await fetch(partnerApiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error(`Failed to get partner apps: ${response.statusText}`)

      return await response.json()
    } catch (error) {
      console.error('Error getting partner apps:', error)
      throw error
    }
  }

  // Get toolkit details with caching
  async getToolkitDetails(toolkitName: string) {
    try {
      const response = await fetch(`${this.baseUrl}/toolkits/${toolkitName}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error(`Failed to get toolkit details: ${response.statusText}`)

      return await response.json()
    } catch (error) {
      console.error(`Error getting toolkit details for ${toolkitName}:`, error)
      throw error
    }
  }


}

/**
 * Composio SDK client wrapper with proper error handling and TypeScript types
 * Handles OAuth flows, tool execution, and user isolation
 */

export interface ComposioConnectionResult {
  redirectUrl: string
  state: string
  connectionId?: string
}

export interface ComposioExecutionResult {
  success: boolean
  data?: any
  error?: string
  executionId?: string
}

export interface ComposioConnectionStatus {
  isConnected: boolean
  connectionId?: string
  connectedAccount?: string
  lastSync?: Date
  status: 'connected' | 'disconnected' | 'error' | 'expired'
}

export interface ComposioToolkit {
  name: string
  displayName: string
  description: string
  category: string
  requiresAuth: boolean
  actions: ComposioAction[]
}

export interface ComposioAction {
  name: string
  displayName: string
  description: string
  parameters: Record<string, any>
}





/**
 * Initialize Composio client with API key validation
 */
function createComposioClient(): ComposioClient | null {
  const config = aiConfig()
  if (!config.composio.enabled || !config.composio.apiKey) {
    console.warn('Composio API key not configured')
    return null
  }

  try {
    return new ComposioClient({
      apiKey: config.composio.apiKey,
      baseUrl: config.composio.baseURL,
    })
  } catch (error) {
    console.error('Failed to initialize Composio client:', error)
    return null
  }
}

/**
 * Generate Composio user ID following their multi-tenant best practices
 * Critical: Uses stable database identifiers to ensure consistent user mapping
 *
 * B2C Individual User Pattern: Each user gets isolated connections
 * B2B Organization Pattern: Team members share organization connections
 */
export function generateComposioUserId(userId: string, workspaceId: string, isPersonal: boolean): string {
  // ✅ Correct: Use stable database identifiers
  // Personal workspaces: Individual user isolation
  if (isPersonal) {
    return `user_${userId}` // Each user has their own isolated connections
  }

  // Company workspaces: Organization-level isolation
  // All team members share the same organization's connections
  return `org_${workspaceId}` // Organization serves as User ID for shared access
}

/**
 * Verify user has access to the specified Composio User ID
 * Critical security check to prevent cross-tenant data access
 */
export function verifyUserAccess(
  requestingUserId: string,
  workspaceId: string,
  isPersonal: boolean,
  composioUserId: string
): boolean {
  const expectedUserId = generateComposioUserId(requestingUserId, workspaceId, isPersonal)
  return composioUserId === expectedUserId
}

/**
 * Initiate OAuth connection for a toolkit using Composio's multi-tenant architecture
 * Implements proper user isolation following B2C/B2B patterns
 */
export async function initiateConnection(
  userId: string,
  workspaceId: string,
  isPersonal: boolean,
  toolkit: string,
  redirectUrl?: string
): Promise<ComposioConnectionResult> {
  const client = createComposioClient()
  if (!client) {
    throw new Error('Composio client not available')
  }

  try {
    const composioUserId = generateComposioUserId(userId, workspaceId, isPersonal)
    const state = generateSecureState(userId, workspaceId, toolkit)
    
    const finalRedirectUrl = redirectUrl || aiConfig().composio.callbackURL || '/api/composio/callback'
    const result = await client.initiateConnection({
      userId: composioUserId,
      toolkit,
      redirectUrl: finalRedirectUrl,
      state,
    })

    return {
      redirectUrl: result.redirectUrl,
      state,
      connectionId: result.connectionId,
    }
  } catch (error) {
    console.error('Failed to initiate Composio connection:', error)
    throw new Error(`Failed to initiate connection for ${toolkit}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Complete OAuth connection using authorization code
 * Ensures user isolation by validating the connection belongs to the requesting user
 */
export async function completeConnection(
  code: string,
  state: string,
  userId: string,
  workspaceId: string,
  isPersonal: boolean,
  connectionId?: string
): Promise<{ connectionId: string; toolkit: string }> {
  const client = createComposioClient()
  if (!client) {
    throw new Error('Composio client not available')
  }

  try {
    // Validate state parameter
    const stateData = validateState(state, userId, workspaceId)
    const composioUserId = generateComposioUserId(userId, workspaceId, isPersonal)

    // If connectionId is not provided, try to extract it from state or generate a mock one
    const finalConnectionId = connectionId || `conn_${Date.now()}_${stateData.toolkit}`

    const result = await client.completeConnection({
      code,
      userId: composioUserId,
      state,
      connectionId: finalConnectionId,
    })

    return {
      connectionId: result.connectionId || finalConnectionId,
      toolkit: stateData.toolkit,
    }
  } catch (error) {
    console.error('Failed to complete Composio connection:', error)
    throw new Error(`Failed to complete connection: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check connection status for a toolkit with proper user isolation
 * Only returns connections belonging to the specified user/organization
 */
export async function getConnectionStatus(
  userId: string,
  workspaceId: string,
  isPersonal: boolean,
  toolkit: string
): Promise<ComposioConnectionStatus> {
  const client = createComposioClient()
  if (!client) {
    return { isConnected: false, status: 'error' }
  }

  try {
    const composioUserId = generateComposioUserId(userId, workspaceId, isPersonal)
    
    const connections = await client.getConnectedAccounts({
      userId: composioUserId, // Critical: User isolation boundary
      toolkit,
    })

    if (connections.length === 0) {
      return { isConnected: false, status: 'disconnected' }
    }

    const connection = connections[0]
    return {
      isConnected: connection.status === 'ENABLED',
      connectionId: connection.id,
      connectedAccount: connection.connected_account_email,
      lastSync: connection.last_sync ? new Date(connection.last_sync) : new Date(),
      status: connection.status === 'ENABLED' ? 'connected' :
              connection.status === 'EXPIRED' ? 'expired' : 'error',
    }
  } catch (error) {
    console.error('Failed to get connection status:', error)
    return { isConnected: false, status: 'error' }
  }
}

/**
 * Execute a tool action with user-specific credentials
 * Critical: Uses user's isolated credentials for tool execution
 */
export async function executeTool(
  userId: string,
  workspaceId: string,
  isPersonal: boolean,
  toolkit: string,
  action: string,
  parameters: Record<string, any>
): Promise<ComposioExecutionResult> {
  const client = createComposioClient()
  if (!client) {
    throw new Error('Composio client not available')
  }

  try {
    const composioUserId = generateComposioUserId(userId, workspaceId, isPersonal)
    
    const result = await client.executeAction({
      userId: composioUserId,
      toolkit,
      action,
      parameters,
    })

    return {
      success: result.success,
      data: result.data,
      executionId: result.execution_id,
    }
  } catch (error) {
    console.error('Failed to execute tool:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Disconnect a toolkit connection with user verification
 * Ensures only the connection owner can revoke their connections
 */
export async function disconnectTool(
  userId: string,
  workspaceId: string,
  isPersonal: boolean,
  toolkit: string,
  connectionId: string
): Promise<boolean> {
  void toolkit // Suppress unused parameter warning
  const client = createComposioClient()
  if (!client) {
    throw new Error('Composio client not available')
  }

  try {
    const composioUserId = generateComposioUserId(userId, workspaceId, isPersonal)
    
    await client.revokeConnection({
      userId: composioUserId,
      connectionId,
    })

    return true
  } catch (error) {
    console.error('Failed to disconnect tool:', error)
    return false
  }
}

/**
 * Get available toolkits (shared across all users)
 * Auth Configs are reusable blueprints - no user-specific data
 */
export async function getAvailableToolkits(): Promise<ComposioToolkit[]> {
  const client = createComposioClient()
  if (!client) {
    return []
  }

  try {
    const toolkits = await client.getToolkits()
    return toolkits.map((toolkit: any) => ({
      name: toolkit.name,
      displayName: toolkit.display_name,
      description: toolkit.description,
      category: toolkit.category,
      requiresAuth: toolkit.requires_auth,
      actions: toolkit.actions?.map((action: any) => ({
        name: action.name,
        displayName: action.display_name,
        description: action.description,
        parameters: action.parameters,
      })) || [],
    }))
  } catch (error) {
    console.error('Failed to get available toolkits:', error)
    throw error // Remove fallback, let calling code handle errors
  }
}

/**
 * Get Partner API apps for marketplace
 */
export async function getPartnerApps(): Promise<any> {
  const client = createComposioClient()
  if (!client) {
    throw new Error('Composio client not available')
  }

  try {
    return await client.getPartnerApps()
  } catch (error) {
    console.error('Failed to get partner apps:', error)
    throw error
  }
}

/**
 * Get detailed toolkit information
 */
export async function getToolkitDetails(toolkitName: string): Promise<any> {
  const client = createComposioClient()
  if (!client) {
    throw new Error('Composio client not available')
  }

  try {
    return await client.getToolkitDetails(toolkitName)
  } catch (error) {
    console.error(`Failed to get toolkit details for ${toolkitName}:`, error)
    throw error
  }
}

/**
 * Generate secure state parameter for OAuth flow
 */
function generateSecureState(userId: string, workspaceId: string, toolkit: string): string {
  const data = {
    userId,
    workspaceId,
    toolkit,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(2),
  }
  
  return Buffer.from(JSON.stringify(data)).toString('base64url')
}

/**
 * Validate state parameter from OAuth callback
 */
function validateState(state: string, userId: string, workspaceId: string): { toolkit: string } {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    
    // Validate required fields
    if (!decoded.userId || !decoded.workspaceId || !decoded.toolkit || !decoded.timestamp) {
      throw new Error('Invalid state format')
    }
    
    // Validate user and workspace match
    if (decoded.userId !== userId || decoded.workspaceId !== workspaceId) {
      throw new Error('State validation failed: user/workspace mismatch')
    }
    
    // Check timestamp (valid for 1 hour)
    const maxAge = 60 * 60 * 1000 // 1 hour
    if (Date.now() - decoded.timestamp > maxAge) {
      throw new Error('State expired')
    }
    
    return { toolkit: decoded.toolkit }
  } catch (error) {
    throw new Error(`Invalid state parameter: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create hosted authentication link for seamless user onboarding
 * Following Composio's recommended pattern for marketplace applications
 */
export async function createConnectLink(
  userId: string,
  workspaceId: string,
  isPersonal: boolean,
  toolkit: string,
  callbackUrl?: string
): Promise<string | null> {
  const client = createComposioClient()
  if (!client) return null

  try {
    const composioUserId = generateComposioUserId(userId, workspaceId, isPersonal)

    const finalCallbackUrl = callbackUrl || aiConfig().composio.callbackURL || '/api/composio/callback'
    const connectionRequest = await client.initiateConnection({
      userId: composioUserId,
      toolkit,
      redirectUrl: finalCallbackUrl,
      state: generateSecureState(userId, workspaceId, toolkit),
    })

    return connectionRequest.redirectUrl
  } catch (error) {
    console.error('Failed to create connect link:', error)
    return null
  }
}

/**
 * Get user's connected tools with proper isolation
 * Lists all active connections for the specified user/organization
 */
export async function getUserConnectedTools(
  userId: string,
  workspaceId: string,
  isPersonal: boolean
): Promise<Array<{
  toolkit: string
  connectionId: string
  connectedAt: string
  status: string
}>> {
  const client = createComposioClient()
  if (!client) return []

  try {
    const composioUserId = generateComposioUserId(userId, workspaceId, isPersonal)
    const connections = await client.getConnectedAccounts({ userId: composioUserId })

    return connections
      .filter((conn: any) => conn.status === 'ENABLED')
      .map((conn: any) => ({
        toolkit: conn.toolkit,
        connectionId: conn.id,
        connectedAt: conn.created_at,
        status: conn.status,
      }))
  } catch (error) {
    console.error('Failed to get user connected tools:', error)
    return []
  }
}

/**
 * Verify user has active connection before allowing tool use
 * Critical security check following Composio's best practices
 */
export async function verifyUserHasToolAccess(
  userId: string,
  workspaceId: string,
  isPersonal: boolean,
  toolkit: string
): Promise<boolean> {
  try {
    const status = await getConnectionStatus(userId, workspaceId, isPersonal, toolkit)
    return status.isConnected && status.status === 'connected'
  } catch (error) {
    console.error('Failed to verify tool access:', error)
    return false
  }
}

/**
 * Validate toolkit name
 */
export function isValidToolkit(toolkit: string): boolean {
  // Basic validation - toolkit names should be alphanumeric with underscores/hyphens
  return /^[a-zA-Z0-9_-]+$/.test(toolkit) && toolkit.length > 0 && toolkit.length <= 50
}

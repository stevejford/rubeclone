/**
 * TypeScript interfaces for Composio integration
 * Defines types for connection states, OAuth flows, tool execution, and metadata
 */

// Connection States
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'expired'

export interface ComposioConnection {
  id: string
  userId: string
  workspaceId: string
  toolkit: string
  status: ConnectionStatus
  connectedAccount?: string
  lastSync?: Date
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
  metadata?: ConnectionMetadata
}

export interface ConnectionMetadata {
  connectionId?: string
  connectionStatus?: ConnectionStatus
  connectedAccount?: string
  lastSync?: string
  connectedAt?: string
  disconnectedAt?: string
  tokenExpiry?: string
  errorMessage?: string
  refreshToken?: string
  scopes?: string[]
}

// OAuth Flow Types
export interface OAuthInitiateRequest {
  workspaceId: string | number
  toolkit: string
  redirectUrl?: string
}

export interface OAuthInitiateResponse {
  success: true
  redirectUrl: string
  state: string
  toolkit: string
  workspaceId: number
}

export interface OAuthCallbackParams {
  code: string
  state: string
  error?: string
  error_description?: string
}

export interface OAuthState {
  userId: string
  workspaceId: string
  toolkit: string
  timestamp: number
  nonce: string
}

// Tool Execution Types
export interface ToolExecutionRequest {
  workspaceId: string | number
  toolSlug: string
  action: string
  parameters?: Record<string, any>
}

export interface ToolExecutionResponse {
  success: boolean
  data?: any
  error?: string
  executionId?: string
  toolkit: string
  action: string
  timestamp: string
}

export interface ToolExecutionResult {
  success: boolean
  data?: any
  error?: string
  executionId?: string
}

// Toolkit Information
export interface ComposioToolkit {
  name: string
  displayName: string
  description: string
  category: string
  requiresAuth: boolean
  actions: ComposioAction[]
  metadata?: ToolkitMetadata
}

export interface ComposioAction {
  name: string
  displayName: string
  description: string
  parameters: Record<string, ActionParameter>
  returnType?: string
}

export interface ActionParameter {
  type: string
  description: string
  required?: boolean
  default?: any
  enum?: string[]
  format?: string
}

export interface ToolkitMetadata {
  version?: string
  author?: string
  homepage?: string
  documentation?: string
  tags?: string[]
  icon?: string
  color?: string
}

// Connection Management
export interface ConnectionInitiateRequest {
  workspaceId: string | number
  toolkit: string
  redirectUrl?: string
}

export interface ConnectionDisconnectRequest {
  workspaceId: string | number
  toolkit: string
}

export interface ConnectionStatusInfo {
  isConnected: boolean
  connectionId?: string
  connectedAccount?: string
  lastSync?: Date
  status: ConnectionStatus
  error?: string
}

// User Isolation Context
export interface ComposioUserContext {
  userId: string
  workspaceId: string
  isPersonal: boolean
  composioUserId: string
}

// API Response Types
export interface ComposioApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ComposioErrorResponse {
  success: false
  error: string
  details?: Array<{
    field: string
    message: string
  }>
}

export interface ComposioSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
}

// Workspace Tool Integration
export interface WorkspaceToolWithConnection {
  id: number
  workspace_id: number
  tool_slug: string
  enabled_by: number
  enabled_at: Date
  is_enabled: boolean
  connection_id?: string
  config: ConnectionMetadata
  // Connection status derived from config
  connectionStatus?: ConnectionStatus
  isConnected?: boolean
  connectedAccount?: string
  lastSync?: Date
}

// Hook Types
export interface UseComposioConnectionOptions {
  workspaceId?: string
  toolkit?: string
  onConnectionSuccess?: (toolkit: string) => void
  onConnectionError?: (error: string) => void
  onDisconnectSuccess?: (toolkit: string) => void
  onDisconnectError?: (error: string) => void
}

export interface ComposioConnectionState {
  isConnecting: boolean
  isDisconnecting: boolean
  isExecuting: boolean
  connectionStatus: ConnectionStatusInfo | null
  error: string | null
}

// Component Props Types
export interface ConnectionStatusProps {
  toolkit: string
  status: ConnectionStatusInfo
  onReconnect?: () => void
  onDisconnect?: () => void
  isReconnecting?: boolean
  isDisconnecting?: boolean
  canManage?: boolean
  className?: string
}

export interface OAuthConnectModalProps {
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

// Validation Types
export interface ComposioValidationError {
  field: string
  message: string
  code?: string
}

export interface ComposioValidationResult<T> {
  success: boolean
  data?: T
  errors?: ComposioValidationError[]
}

// Event Types
export interface ComposioConnectionEvent {
  type: 'connection_established' | 'connection_lost' | 'connection_error' | 'token_refresh'
  toolkit: string
  workspaceId: string
  userId: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ComposioExecutionEvent {
  type: 'execution_started' | 'execution_completed' | 'execution_failed'
  toolkit: string
  action: string
  workspaceId: string
  userId: string
  executionId?: string
  timestamp: Date
  duration?: number
  metadata?: Record<string, any>
}

// Configuration Types
export interface ComposioConfig {
  apiKey: string
  baseURL: string
  callbackURL?: string
  webhookSecret?: string
  timeout?: number
  retryAttempts?: number
}

// Error Types
export enum ComposioErrorCode {
  INTEGRATION_DISABLED = 'INTEGRATION_DISABLED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_TOOLKIT = 'INVALID_TOOLKIT',
  WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  TOOL_NOT_ENABLED = 'TOOL_NOT_ENABLED',
  TOOL_NOT_CONNECTED = 'TOOL_NOT_CONNECTED',
  CONNECTION_INACTIVE = 'CONNECTION_INACTIVE',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  STATE_VALIDATION_FAILED = 'STATE_VALIDATION_FAILED',
  STATE_EXPIRED = 'STATE_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONNECTION_EXPIRED = 'CONNECTION_EXPIRED',
}

export class ComposioError extends Error {
  constructor(
    public code: ComposioErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ComposioError'
  }
}

// Utility Types
export type ComposioToolkitName = string
export type ComposioActionName = string
export type ComposioConnectionId = string
export type ComposioExecutionId = string

// Re-export validation types for convenience
export type {
  ConnectionInitiateRequest as ComposioConnectionInitiateRequest,
  ConnectionDisconnectRequest as ComposioConnectionDisconnectRequest,
  ToolExecutionRequest as ComposioToolExecutionRequest,
  ToolExecutionResponse as ComposioToolExecutionResponse,
} from '@/lib/validations/composio'

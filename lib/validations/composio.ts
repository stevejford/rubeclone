import { z } from 'zod'

/**
 * Zod validation schemas for Composio-related API operations
 * Includes schemas for connection management, tool execution, and OAuth flows
 */

// Base toolkit validation
export const toolkitSchema = z.string()
  .min(1, 'Toolkit name is required')
  .max(50, 'Toolkit name must be 50 characters or less')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Toolkit name can only contain letters, numbers, underscores, and hyphens')

// Workspace ID validation
export const workspaceIdSchema = z.union([
  z.string().transform(Number),
  z.number()
]).refine(val => Number.isInteger(val) && val > 0, 'Workspace ID must be a positive integer')

// Connection initiation request
export const connectionInitiateSchema = z.object({
  workspaceId: workspaceIdSchema,
  toolkit: toolkitSchema,
  redirectUrl: z.string().url().optional(),
})

export type ConnectionInitiateRequest = z.infer<typeof connectionInitiateSchema>

// OAuth callback validation
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
  error: z.string().optional(),
  error_description: z.string().optional(),
})

export type OAuthCallbackParams = z.infer<typeof oauthCallbackSchema>

// OAuth state parameter validation
export const oauthStateSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  toolkit: toolkitSchema,
  timestamp: z.number().int().positive(),
  nonce: z.string().min(1),
})

export type OAuthState = z.infer<typeof oauthStateSchema>

// Tool execution request
export const toolExecutionSchema = z.object({
  workspaceId: workspaceIdSchema,
  toolSlug: z.string()
    .min(1, 'Tool slug is required')
    .max(100, 'Tool slug must be 100 characters or less'),
  action: z.string()
    .min(1, 'Action is required')
    .max(100, 'Action must be 100 characters or less'),
  parameters: z.record(z.any()).default({}),
})

export type ToolExecutionRequest = z.infer<typeof toolExecutionSchema>

// Tool execution response
export const toolExecutionResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  executionId: z.string().optional(),
  toolkit: z.string(),
  action: z.string(),
  timestamp: z.string().datetime(),
})

export type ToolExecutionResponse = z.infer<typeof toolExecutionResponseSchema>

// Connection disconnect request
export const connectionDisconnectSchema = z.object({
  workspaceId: workspaceIdSchema,
  toolkit: toolkitSchema,
})

export type ConnectionDisconnectRequest = z.infer<typeof connectionDisconnectSchema>

// Connection status validation
export const connectionStatusSchema = z.object({
  isConnected: z.boolean(),
  connectionId: z.string().optional(),
  connectedAccount: z.string().optional(),
  lastSync: z.date().optional(),
  status: z.enum(['connected', 'disconnected', 'error', 'expired']),
})

export type ConnectionStatus = z.infer<typeof connectionStatusSchema>

// Connection metadata for database storage
export const connectionMetadataSchema = z.object({
  connectionId: z.string().optional(),
  connectionStatus: z.enum(['connected', 'disconnected', 'error', 'expired']).optional(),
  connectedAccount: z.string().optional(),
  lastSync: z.string().datetime().optional(),
  connectedAt: z.string().datetime().optional(),
  disconnectedAt: z.string().datetime().optional(),
  tokenExpiry: z.string().datetime().optional(),
  errorMessage: z.string().optional(),
})

export type ConnectionMetadata = z.infer<typeof connectionMetadataSchema>

// Toolkit information
export const toolkitInfoSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  category: z.string(),
  requiresAuth: z.boolean(),
  actions: z.array(z.object({
    name: z.string(),
    displayName: z.string(),
    description: z.string(),
    parameters: z.record(z.any()),
  })),
})

export type ToolkitInfo = z.infer<typeof toolkitInfoSchema>

// API response schemas
export const apiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
  message: z.string().optional(),
})

export const apiErrorResponseSchema = z.object({
  success: z.literal(false).optional(),
  error: z.string(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
})

export type ApiSuccessResponse = z.infer<typeof apiSuccessResponseSchema>
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>

// Connection initiation response
export const connectionInitiateResponseSchema = z.object({
  success: z.literal(true),
  redirectUrl: z.string().url(),
  state: z.string(),
  toolkit: z.string(),
  workspaceId: z.number(),
})

export type ConnectionInitiateResponse = z.infer<typeof connectionInitiateResponseSchema>

// Connection disconnect response
export const connectionDisconnectResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  toolkit: z.string(),
  workspaceId: z.number(),
  disconnectedAt: z.string().datetime(),
})

export type ConnectionDisconnectResponse = z.infer<typeof connectionDisconnectResponseSchema>

// Validation helper functions
export function validateToolkitName(toolkit: string): boolean {
  return toolkitSchema.safeParse(toolkit).success
}

export function validateWorkspaceId(workspaceId: string | number): boolean {
  return workspaceIdSchema.safeParse(workspaceId).success
}

export function validateOAuthState(state: string): OAuthState | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    const result = oauthStateSchema.safeParse(decoded)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function validateConnectionMetadata(metadata: any): ConnectionMetadata | null {
  const result = connectionMetadataSchema.safeParse(metadata)
  return result.success ? result.data : null
}

// Error message constants
export const COMPOSIO_ERROR_MESSAGES = {
  INTEGRATION_DISABLED: 'Composio integration is not enabled',
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INVALID_TOOLKIT: 'Invalid toolkit name',
  WORKSPACE_NOT_FOUND: 'Workspace not found',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions. Only workspace owners and admins can manage tools.',
  TOOL_NOT_ENABLED: 'Tool is not enabled for this workspace',
  TOOL_NOT_CONNECTED: 'Tool is not connected. Please connect the tool first.',
  CONNECTION_INACTIVE: 'Tool connection is not active. Please reconnect the tool.',
  SERVICE_UNAVAILABLE: 'Composio service is temporarily unavailable',
  CONNECTION_FAILED: 'Failed to establish connection with the service',
  EXECUTION_FAILED: 'Tool execution failed',
  STATE_VALIDATION_FAILED: 'Security validation failed',
  STATE_EXPIRED: 'Connection request expired. Please try again.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  CONNECTION_EXPIRED: 'Tool connection has expired. Please reconnect the tool.',
} as const

export type ComposioErrorMessage = typeof COMPOSIO_ERROR_MESSAGES[keyof typeof COMPOSIO_ERROR_MESSAGES]

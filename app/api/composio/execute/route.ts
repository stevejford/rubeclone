import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ComposioClient } from '@/lib/composioClient'
import { getWorkspaceTool, recordToolUsage, isWorkspaceMemberOrOwner } from '@/lib/db/queries'
import { aiConfig } from '@/lib/env'
import { requireSession } from '@/lib/api/guards'

/**
 * Tool execution proxy endpoint for secure tool operations
 * POST /api/composio/execute
 */

const executeRequestSchema = z.object({
  workspaceId: z.string().transform(Number),
  toolSlug: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  parameters: z.record(z.any()).default({}),
})

export async function POST(request: NextRequest) {
  try {
    // Check if Composio is enabled
    if (!aiConfig().composio.enabled) {
      return NextResponse.json(
        { error: 'Composio integration is not enabled' },
        { status: 503 }
      )
    }

    // Verify user authentication
    const { userId } = await requireSession(request)

    // Parse and validate request body
    const body = await request.json()
    const parseResult = executeRequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: parseResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    const { workspaceId, toolSlug, action, parameters } = parseResult.data

    // Verify workspace access permissions
    const hasAccess = await isWorkspaceMemberOrOwner(workspaceId, userId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      )
    }

    // Verify tool is enabled for the workspace
    const workspaceTool = await getWorkspaceTool(workspaceId, toolSlug)
    if (!workspaceTool || !workspaceTool.is_enabled) {
      return NextResponse.json(
        { error: 'Tool is not enabled for this workspace' },
        { status: 403 }
      )
    }

    // Check if tool has an active connection
    if (!workspaceTool.connection_id) {
      return NextResponse.json(
        { error: 'Tool is not connected. Please connect the tool first.' },
        { status: 400 }
      )
    }

    // Validate connection status from config
    const config = workspaceTool.config as any
    if (config?.connectionStatus !== 'connected') {
      return NextResponse.json(
        { error: 'Tool connection is not active. Please reconnect the tool.' },
        { status: 400 }
      )
    }

    // Execute the tool action via unified Composio client
    const client = new ComposioClient()
    const executionResult = await client.executeAction(String(userId), toolSlug, action, parameters)

    // Record usage statistics for billing and analytics
    try {
      await recordToolUsage(
        userId,
        workspaceId,
        toolSlug,
        new Date()
      )
    } catch (usageError) {
      // Log but don't fail the request for usage tracking errors
      console.error('Failed to record tool usage:', usageError)
    }

    // Return execution results
    if (executionResult.success) {
      return NextResponse.json({
        success: true,
        data: executionResult.data,
        executionId: executionResult.executionId,
        toolkit: toolSlug,
        action,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: executionResult.error || 'Tool execution failed',
          toolkit: toolSlug,
          action,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Composio execute error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Composio client not available')) {
        return NextResponse.json(
          { error: 'Composio service is temporarily unavailable' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('Invalid parameters')) {
        return NextResponse.json(
          { error: 'Invalid parameters provided for tool execution' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('Connection expired')) {
        return NextResponse.json(
          { error: 'Tool connection has expired. Please reconnect the tool.' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to execute tools.' },
    { status: 405 }
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSession } from '@/lib/api/guards'
import { enableWorkspaceTool, isWorkspaceOwnerOrAdmin } from '@/lib/db/queries'
import { ComposioClient } from '@/lib/composioClient'
import { aiConfig } from '@/lib/env'

/**
 * API endpoint for connecting with API keys via Composio
 * POST /api/composio/connect-api-key
 */

const connectApiKeySchema = z.object({
  workspaceId: z.string().transform(Number),
  toolkit: z.string().min(1).max(50),
  apiKey: z.string().min(1).max(500),
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

    // Parse and validate request body
    const body = await request.json()
    const parseResult = connectApiKeySchema.safeParse(body)
    
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

    const { userId } = await requireSession(request)

    const { workspaceId, toolkit, apiKey } = parseResult.data
    // Verify permissions (owner/admin)
    const allowed = await isWorkspaceOwnerOrAdmin(workspaceId, userId)
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.log(`🔗 Connecting API key for toolkit: ${toolkit}, user: ${userId}, workspace: ${workspaceId}`)

    // Connect with API key using Composio MCP client
    const client = new ComposioClient()
    const connectionResult = await client.initiateApiKey(userId.toString(), toolkit, { api_key: apiKey })

    if (connectionResult.connectionId) {
      console.log(`✅ API key connection successful for ${toolkit}: ${connectionResult.connectionId}`)
      
      // Update workspace_tools table with connection details
      await enableWorkspaceTool(
        workspaceId,
        toolkit,
        userId,
        {
          connectionId: connectionResult.connectionId,
          connectionStatus: 'connected',
          authType: 'api_key',
          lastSync: new Date().toISOString(),
          connectedAt: new Date().toISOString(),
        }
      )

      return NextResponse.json({
        success: true,
        connectionId: connectionResult.connectionId,
        toolkit,
        message: `Successfully connected ${toolkit} with API key`
      })
    } else {
      console.log(`❌ API key connection failed for ${toolkit}`)
      return NextResponse.json({
        success: false,
        error: 'Failed to connect with API key'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('API key connection error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Composio client not available')) {
        return NextResponse.json(
          { error: 'Composio service is temporarily unavailable' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('Invalid toolkit')) {
        return NextResponse.json(
          { error: 'The specified toolkit is not supported' },
          { status: 400 }
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
    { error: 'Method not allowed. Use POST to connect with API keys.' },
    { status: 405 }
  )
}
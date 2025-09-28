import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ComposioClient } from '@/lib/composioClient'
import { getWorkspaceTool, disableWorkspaceTool, isWorkspaceOwnerOrAdmin } from '@/lib/db/queries'
import { aiConfig } from '@/lib/env'
import { requireSession } from '@/lib/api/guards'

/**
 * Endpoint for disconnecting Composio OAuth connections
 * DELETE /api/composio/disconnect
 */

const disconnectRequestSchema = z.object({
  workspaceId: z.string().transform(Number),
  toolkit: z.string().min(1).max(50),
})

export async function DELETE(request: NextRequest) {
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
    const parseResult = disconnectRequestSchema.safeParse(body)
    
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

    const { workspaceId, toolkit } = parseResult.data
    // Verify permissions (owner/admin)
    const allowed = await isWorkspaceOwnerOrAdmin(workspaceId, userId)
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the workspace tool to retrieve connection ID
    const workspaceTool = await getWorkspaceTool(workspaceId, toolkit)
    if (!workspaceTool) {
      return NextResponse.json(
        { error: 'Tool not found in workspace' },
        { status: 404 }
      )
    }

    if (!workspaceTool.connection_id) {
      return NextResponse.json(
        { error: 'Tool is not connected' },
        { status: 400 }
      )
    }

    // Disconnect the tool via unified Composio client
    const client = new ComposioClient()
    const disconnectSuccess = await client.revokeConnection(workspaceTool.connection_id)

    if (!disconnectSuccess) {
      // Even if Composio disconnect fails, we should clean up our database
      console.warn(`Failed to disconnect ${toolkit} from Composio, but cleaning up database`)
    }

    // Update workspace_tools table to remove connection and disable tool
    await disableWorkspaceTool(workspaceId, toolkit, {
      connectionId: null,
      connectionStatus: 'disconnected',
      disconnectedAt: new Date().toISOString(),
      lastSync: null,
    })

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${toolkit}`,
      toolkit,
      workspaceId,
      disconnectedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Composio disconnect error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use DELETE to disconnect tools.' },
    { status: 405 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use DELETE to disconnect tools.' },
    { status: 405 }
  )
}

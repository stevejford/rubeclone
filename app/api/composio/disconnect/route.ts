import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { getAuthOptions } from '@/lib/auth'
import { disconnectTool } from '@/lib/composio'
import { getWorkspaceWithPermissions, getWorkspaceTool, disableWorkspaceTool } from '@/lib/db/queries'
import { aiConfig } from '@/lib/env'

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
    const session = await getServerSession(getAuthOptions())
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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

    try {
      // Verify workspace permissions (owner/admin only)
    const workspace = await getWorkspaceWithPermissions(workspaceId, parseInt(session.user.id))
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to manage tools (owner or admin)
    const userRole = workspace.owner_id === parseInt(session.user.id) ? 'owner' :
                    workspace.members?.find((m: any) => m.user_id === parseInt(session.user.id))?.role
    
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only workspace owners and admins can disconnect tools.' },
        { status: 403 }
      )
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

    // Disconnect the tool via Composio SDK
    const disconnectSuccess = await disconnectTool(
      session.user.id,
      workspaceId.toString(),
      workspace.type === 'personal',
      toolkit,
      workspaceTool.connection_id
    )

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
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Composio client not available')) {
        return NextResponse.json(
          { error: 'Composio service is temporarily unavailable' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('Connection not found')) {
        // Clean up database even if connection doesn't exist in Composio
        try {
          await disableWorkspaceTool(workspaceId, toolkit, {
            connectionId: null,
            connectionStatus: 'disconnected',
            disconnectedAt: new Date().toISOString(),
          })
        } catch (cleanupError) {
          console.error('Failed to cleanup after connection not found:', cleanupError)
        }
        
        return NextResponse.json(
          { error: 'Connection not found, but cleaned up local records' },
          { status: 404 }
        )
      }
    }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  } catch (outerError) {
    console.error('Outer error in disconnect route:', outerError)
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

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { getAuthOptions } from '@/lib/auth'
import { isValidToolkit, generateComposioUserId } from '@/lib/composio-utils'
import { getWorkspaceWithPermissions } from '@/lib/db/queries'
import { aiConfig } from '@/lib/env'
import { zId } from '@/lib/utils/ids'
import { ComposioClient } from '@/lib/composioClient'

/**
 * API endpoint for initiating Composio OAuth connections
 * POST /api/composio/connect
 */

const connectRequestSchema = z.object({
  workspaceId: zId(),
  toolkit: z.string().min(1).max(50),
  source: z.string().optional().default('workspace'),
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
    const session = await getServerSession(getAuthOptions())
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const parseResult = connectRequestSchema.safeParse(body)
    
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

    const { workspaceId, toolkit, source } = parseResult.data

    // Validate toolkit name
    if (!isValidToolkit(toolkit)) {
      return NextResponse.json(
        { error: 'Invalid toolkit name' },
        { status: 400 }
      )
    }

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
        { error: 'Insufficient permissions. Only workspace owners and admins can connect tools.' },
        { status: 403 }
      )
    }

    console.log('🔗 OAuth Connect Debug:', {
      userId: session.user.id,
      workspaceId,
      toolkit,
      source,
      isPersonal: workspace.type === 'personal'
    })

    const client = new ComposioClient()
    const composioUserId = generateComposioUserId(session.user.id, String(workspaceId), workspace.type === 'personal')
    const state = client.encodeState(session.user.id, String(workspaceId), toolkit, source as any)
    const callbackUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/composio/callback`
    const connectionResult = await client.linkOAuth(composioUserId, toolkit, callbackUrl, state)

    console.log('✅ Connection initiated:', connectionResult)

    return NextResponse.json({
      success: true,
      redirectUrl: connectionResult.redirectUrl,
      state: connectionResult.state,
      toolkit,
      workspaceId,
    })

  } catch (error) {
    console.error('Composio connect error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid toolkit')) {
        return NextResponse.json(
          { error: 'The specified toolkit is not supported' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Composio client not available')) {
        return NextResponse.json(
          { error: 'Composio service is temporarily unavailable' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('Failed to initiate connection')) {
        return NextResponse.json(
          { error: 'Failed to initiate OAuth connection. Please try again.' },
          { status: 500 }
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
    { error: 'Method not allowed. Use POST to initiate connections.' },
    { status: 405 }
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { ComposioClient } from '@/lib/composioClient'
import { isValidToolkit, generateComposioUserId } from '@/lib/composio-utils'
import { getWorkspaceWithPermissions } from '@/lib/db/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; slug: string } }
) {
  try {
    const session = await getServerSession(getAuthOptions())
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const workspaceId = parseInt(params.id)
    const toolSlug = params.slug

    // Validate toolkit name
    if (!isValidToolkit(toolSlug)) {
      return NextResponse.json(
        { error: 'Invalid toolkit name' },
        { status: 400 }
      )
    }

    // Check if user has access to the workspace
    const workspace = await getWorkspaceWithPermissions(
      workspaceId, 
      parseInt(session.user.id)
    )
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Get connection status from Composio
    const client = new ComposioClient()
    const composioUserId = generateComposioUserId(session.user.id, params.id, workspace.type === 'personal')
    const connectionStatus = await client.getConnectionStatus(composioUserId, toolSlug)

    return NextResponse.json({
      success: true,
      data: connectionStatus,
    })
  } catch (error) {
    console.error('Error getting tool auth status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { ComposioClient } from '@/lib/composioClient'
import { generateComposioUserId } from '@/lib/composio-utils'
import { getWorkspaceWithPermissions } from '@/lib/db/queries'
import { marketplaceApps } from '@/lib/data/marketplace-apps'

/**
 * API endpoint for checking marketplace app connection status
 * GET /api/marketplace/[id]/status?workspaceId=123
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(getAuthOptions())
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    const appId = params.id
    
    // Find the app in marketplace
    const app = marketplaceApps.find(a => a.id === appId)
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      )
    }

    // Verify workspace access
    const workspace = await getWorkspaceWithPermissions(
      parseInt(workspaceId), 
      parseInt(session.user.id)
    )
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // If app doesn't require OAuth, return basic status
    if (!app.requiresOAuth || !app.composioToolkit) {
      return NextResponse.json({
        appId,
        requiresOAuth: false,
        isConnected: false,
        status: 'no_auth_required'
      })
    }

    // Get connection status from Composio
    const client = new ComposioClient()
    const composioUserId = generateComposioUserId(session.user.id, workspaceId, workspace.type === 'personal')
    const connectionStatus = await client.getConnectionStatus(composioUserId, app.composioToolkit)

    return NextResponse.json({
      appId,
      requiresOAuth: true,
      toolkit: app.composioToolkit,
      isConnected: connectionStatus.isConnected,
      status: connectionStatus.status,
      connectionId: connectionStatus.connectionId,
      connectedAccount: connectionStatus.connectedAccount,
      lastSync: connectionStatus.lastSync,
    })

  } catch (error) {
    console.error('Error checking app status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

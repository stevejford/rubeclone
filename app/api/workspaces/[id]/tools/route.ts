import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceTools, enableWorkspaceTool, disableWorkspaceTool, getWorkspaceWithPermissions } from '@/lib/db/queries';
import { workspaceToolSchema } from '@/lib/validations/workspace';
import { isValidToolkit, generateComposioUserId } from '@/lib/composio-utils';
import { z } from 'zod';
import { requireWorkspaceMember, requireWorkspaceAdmin } from '@/lib/api/guards';
import { ComposioClient } from '@/lib/composioClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, workspaceId } = await requireWorkspaceMember(request, params);
    const tools = await getWorkspaceTools(workspaceId);

    // Enhance tools with connection status for OAuth-enabled tools
    const enhancedTools = await Promise.all(
      tools.map(async (tool) => {
        // Check if this tool requires OAuth and get connection status
        if (isValidToolkit(tool.tool_slug)) {
          try {
            const workspace = await getWorkspaceWithPermissions(workspaceId, userId);
            if (workspace) {
              const client = new ComposioClient()
              const composioUserId = generateComposioUserId(String(userId), String(workspaceId), workspace.type === 'personal')
              const connectionStatus = await client.getConnectionStatus(composioUserId, tool.tool_slug)

              return {
                ...tool,
                connectionStatus: connectionStatus.status,
                isConnected: connectionStatus.isConnected,
                connectedAccount: connectionStatus.connectedAccount,
                lastSync: connectionStatus.lastSync,
              };
            }
          } catch (error) {
            console.error(`Failed to get connection status for ${tool.tool_slug}:`, error);
          }
        }

        return tool;
      })
    );

    return NextResponse.json({ tools: enhancedTools });
  } catch (error) {
    console.error('Error fetching workspace tools:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, workspaceId } = await requireWorkspaceAdmin(request, params);

    const body = await request.json();
    const validatedData = workspaceToolSchema.parse(body);

    // Check if this toolkit requires authentication by checking marketplace data
    // We need to fetch the app info from marketplace to determine auth requirements
    let requiresAuth = false;
    try {
      // Fetch app info from marketplace to check auth requirements
      const marketplaceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/marketplace/apps?q=${validatedData.toolSlug}&limit=1`);
      if (marketplaceResponse.ok) {
        const marketplaceData = await marketplaceResponse.json();
        const app = marketplaceData.data?.apps?.find((a: any) => a.slug === validatedData.toolSlug);
        requiresAuth = app?.requires_auth || false;
      }
    } catch (error) {
      console.warn('Failed to fetch marketplace data for auth check:', error);
      // Fallback: assume auth required for safety if we can't determine
      requiresAuth = isValidToolkit(validatedData.toolSlug);
    }

    // Only check OAuth connection for apps that actually require authentication
    if (requiresAuth && isValidToolkit(validatedData.toolSlug)) {
      // For OAuth tools, check if connection exists before enabling
      const workspace = await getWorkspaceWithPermissions(workspaceId, userId);
      if (workspace) {
        const client = new ComposioClient()
        const composioUserId = generateComposioUserId(String(userId), String(workspaceId), workspace.type === 'personal')
        const connectionStatus = await client.getConnectionStatus(composioUserId, validatedData.toolSlug)

        if (!connectionStatus.isConnected) {
          return NextResponse.json(
            {
              error: 'OAuth connection required',
              requiresConnection: true,
              toolkit: validatedData.toolSlug,
              message: `Please connect your ${validatedData.toolSlug} account first.`
            },
            { status: 400 }
          );
        }

        // Include connection info in config
        validatedData.config = {
          ...validatedData.config,
          connectionId: connectionStatus.connectionId,
          connectionStatus: connectionStatus.status,
          connectedAccount: connectionStatus.connectedAccount,
          lastSync: connectionStatus.lastSync?.toISOString(),
        };
      }
    }

    const tool = await enableWorkspaceTool(
      workspaceId,
      validatedData.toolSlug,
      userId,
      validatedData.config
    );

    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error enabling workspace tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId } = await requireWorkspaceAdmin(request, params);

    const { searchParams } = new URL(request.url);
    const toolSlug = searchParams.get('toolSlug');
    
    if (!toolSlug) {
      return NextResponse.json(
        { error: 'Tool slug is required' },
        { status: 400 }
      );
    }

    await disableWorkspaceTool(workspaceId, toolSlug);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disabling workspace tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

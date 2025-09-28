import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import {
  getWorkspaceTools,
  enableWorkspaceTool,
  disableWorkspaceTool,
  isWorkspaceOwnerOrAdmin,
  isWorkspaceMemberOrOwner,
  getWorkspaceWithPermissions
} from '@/lib/db/queries';
import { workspaceToolSchema } from '@/lib/validations/workspace';
import { getConnectionStatus, isValidToolkit } from '@/lib/composio';
import { z } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate workspace ID format
    const workspaceId = parseInt(params.id, 10);
    if (isNaN(workspaceId) || workspaceId <= 0) {
      return NextResponse.json(
        { error: 'Invalid workspace ID format' },
        { status: 400 }
      );
    }

    // Check if user is member or owner before listing tools
    const hasAccess = await isWorkspaceMemberOrOwner(params.id, session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const tools = await getWorkspaceTools(params.id);

    // Enhance tools with connection status for OAuth-enabled tools
    const enhancedTools = await Promise.all(
      tools.map(async (tool) => {
        // Check if this tool requires OAuth and get connection status
        if (isValidToolkit(tool.tool_slug)) {
          try {
            const workspace = await getWorkspaceWithPermissions(parseInt(params.id), parseInt(session.user.id));
            if (workspace) {
              const connectionStatus = await getConnectionStatus(
                session.user.id,
                params.id,
                workspace.type === 'personal',
                tool.tool_slug
              );

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
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate workspace ID format
    const workspaceId = parseInt(params.id, 10);
    if (isNaN(workspaceId) || workspaceId <= 0) {
      return NextResponse.json(
        { error: 'Invalid workspace ID format' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin
    const hasPermission = await isWorkspaceOwnerOrAdmin(params.id, session.user.id);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

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
      const workspace = await getWorkspaceWithPermissions(parseInt(params.id), parseInt(session.user.id));
      if (workspace) {
        const connectionStatus = await getConnectionStatus(
          session.user.id,
          params.id,
          workspace.type === 'personal',
          validatedData.toolSlug
        );

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
      parseInt(params.id, 10),
      validatedData.toolSlug,
      parseInt(session.user.id, 10),
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
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate workspace ID format
    const workspaceId = parseInt(params.id, 10);
    if (isNaN(workspaceId) || workspaceId <= 0) {
      return NextResponse.json(
        { error: 'Invalid workspace ID format' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const toolSlug = searchParams.get('toolSlug');
    
    if (!toolSlug) {
      return NextResponse.json(
        { error: 'Tool slug is required' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin
    const hasPermission = await isWorkspaceOwnerOrAdmin(params.id, session.user.id);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await disableWorkspaceTool(parseInt(params.id, 10), toolSlug);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disabling workspace tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

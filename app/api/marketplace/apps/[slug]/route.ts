import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { composioMarketplaceService } from '@/lib/services/composio-marketplace';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
// import { getUserWorkspaces } from '@/lib/db/queries/workspaces';

const paramsSchema = z.object({
  slug: z.string().min(1, 'App slug is required'),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Validate route parameters
    const { slug } = paramsSchema.parse(params);

    // Get app details from marketplace service
    const app = await composioMarketplaceService.getAppDetails(slug);

    if (!app) {
      return NextResponse.json({
        success: false,
        error: 'App not found',
        message: `No app found with slug: ${slug}`,
      }, { status: 404 });
    }

    // Get user session for workspace context
    const session = await getServerSession(getAuthOptions());
    let installationStatus = null;

    if (session?.user?.id) {
      try {
        // Get user's workspaces to check installation status
        // const workspaces = await getUserWorkspaces(session.user.id);
        
        // Check if app is installed in any workspace
        // This would need to be implemented based on your workspace tools schema
        installationStatus = {
          isInstalled: false, // TODO: Check actual installation status
          installedWorkspaces: [], // TODO: Get workspaces where app is installed
          connectionStatus: 'not_connected', // TODO: Check connection status
        };
      } catch (error) {
        console.error('Error checking installation status:', error);
        // Continue without installation status if there's an error
      }
    }

    // Get toolkit details if available
    let toolkitDetails = null;
    if (app.slug) {
      try {
        toolkitDetails = await composioMarketplaceService.getToolkitDetails(app.slug);
      } catch (error) {
        console.error(`Error fetching toolkit details for ${app.slug}:`, error);
        // Continue without toolkit details if there's an error
      }
    }

    // Set cache headers
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      'CDN-Cache-Control': 'public, s-maxage=600',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
    };

    return NextResponse.json({
      success: true,
      data: {
        app,
        installationStatus,
        toolkitDetails,
        metadata: {
          fetchedAt: new Date().toISOString(),
          hasAuth: !!session?.user?.id,
        },
      },
    }, {
      status: 200,
      headers: cacheHeaders,
    });

  } catch (error) {
    console.error('App details API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    if (error instanceof Error) {
      // Handle specific marketplace service errors
      if (error.message.includes('Partner API error')) {
        return NextResponse.json({
          success: false,
          error: 'External service unavailable',
          message: 'The marketplace service is temporarily unavailable. Please try again later.',
        }, { status: 503 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching app details.',
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

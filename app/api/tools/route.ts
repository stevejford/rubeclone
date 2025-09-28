import { NextRequest, NextResponse } from 'next/server'

/**
 * @deprecated This endpoint is deprecated. Use /api/marketplace/apps instead.
 * This route now proxies requests to the new marketplace endpoint for backward compatibility.
 */
export async function GET(request: NextRequest) {
  try {
    // Extract search parameters from the original request
    const { searchParams } = new URL(request.url)

    // Construct the new marketplace API URL
    const marketplaceUrl = new URL('/api/marketplace/apps', request.url)

    // Copy all search parameters to the new URL
    searchParams.forEach((value, key) => {
      marketplaceUrl.searchParams.set(key, value)
    })

    // Make internal request to the new marketplace endpoint
    const response = await fetch(marketplaceUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward any relevant headers
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
    })

    if (!response.ok) {
      throw new Error(`Marketplace API returned ${response.status}`)
    }

    const data = await response.json()

    // Transform the new response format to match the old format for backward compatibility
    const legacyResponse = {
      tools: data.data?.apps || [],
      pagination: {
        page: data.data?.pagination?.page || 1,
        limit: data.data?.pagination?.limit || 24,
        totalCount: data.data?.pagination?.total || 0,
        totalPages: data.data?.pagination?.totalPages || 0,
        hasNext: data.data?.pagination?.hasNext || false,
        hasPrev: data.data?.pagination?.hasPrev || false,
      },
    }

    return NextResponse.json(legacyResponse, {
      status: 200,
      headers: {
        'X-Deprecated': 'true',
        'X-Replacement-Endpoint': '/api/marketplace/apps',
        'X-Deprecation-Date': '2024-01-01',
        // Forward cache headers from the marketplace API
        ...(response.headers.get('cache-control') && {
          'Cache-Control': response.headers.get('cache-control')!
        }),
      },
    })

  } catch (error) {
    console.error('Error in deprecated tools endpoint:', error)

    return NextResponse.json({
      error: 'Internal server error',
      message: 'This endpoint is deprecated. Please use /api/marketplace/apps instead.',
      deprecation: {
        deprecated: true,
        replacement: '/api/marketplace/apps',
        sunset_date: '2024-06-01',
      },
    }, {
      status: 500,
      headers: {
        'X-Deprecated': 'true',
        'X-Replacement-Endpoint': '/api/marketplace/apps',
      },
    })
  }
}

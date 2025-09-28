import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { getAuthOptions } from '@/lib/auth'
import { getComposioMCPClient } from '@/lib/composio-mcp'
import { aiConfig } from '@/lib/env'

/**
 * API endpoint for testing API keys with Composio
 * POST /api/composio/test-api-key
 */

const testApiKeySchema = z.object({
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
    const parseResult = testApiKeySchema.safeParse(body)
    
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

    const { toolkit, apiKey } = parseResult.data

    console.log(`🧪 Testing API key for toolkit: ${toolkit}`)

    // Test the API key using Composio MCP client
    const mcpClient = getComposioMCPClient()
    const testResult = await mcpClient.testApiKey(toolkit, apiKey)

    if (testResult.success) {
      console.log(`✅ API key test successful for ${toolkit}`)
      return NextResponse.json({
        success: true,
        message: `API key is valid for ${toolkit}`
      })
    } else {
      console.log(`❌ API key test failed for ${toolkit}: ${testResult.error}`)
      return NextResponse.json({
        success: false,
        error: testResult.error || 'Invalid API key'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('API key test error:', error)
    
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
    { error: 'Method not allowed. Use POST to test API keys.' },
    { status: 405 }
  )
}
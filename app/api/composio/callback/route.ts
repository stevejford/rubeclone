import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { getAuthOptions } from '@/lib/auth'
import { completeConnection } from '@/lib/composio'
import { getWorkspaceWithPermissions, enableWorkspaceTool } from '@/lib/db/queries'
import { aiConfig } from '@/lib/env'

/**
 * OAuth callback endpoint for Composio connections
 * GET /api/composio/callback?code=...&state=...
 */

const callbackParamsSchema = z.object({
  // Traditional OAuth parameters
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
  // Composio hosted authentication parameters
  success: z.string().optional(),
  userId: z.string().optional(),
  toolkit: z.string().optional(),
  connectionId: z.string().optional(),
  message: z.string().optional(),
}).passthrough() // Allow additional parameters from OAuth provider

export async function GET(request: NextRequest) {
  console.log('🚨 CALLBACK ROUTE HIT! URL:', request.nextUrl.href)
  console.log('🚨 ALL SEARCH PARAMS:', Object.fromEntries(request.nextUrl.searchParams.entries()))
  
  try {
    // Check if Composio is enabled
    if (!aiConfig().composio.enabled) {
      return redirectWithError(request, 'Composio integration is not enabled')
    }

    // Verify user authentication
    const session = await getServerSession(getAuthOptions())
    if (!session?.user?.id) {
      return redirectWithError(request, 'Authentication required')
    }

    // Parse callback parameters
    const searchParams = request.nextUrl.searchParams
    const params = {
      // Traditional OAuth parameters
      code: searchParams.get('code'),
      state: searchParams.get('state'),
      error: searchParams.get('error'),
      error_description: searchParams.get('error_description'),
      // Composio hosted authentication parameters
      success: searchParams.get('success'),
      userId: searchParams.get('userId'),
      toolkit: searchParams.get('toolkit'),
      connectionId: searchParams.get('connectionId'),
      message: searchParams.get('message'),
    }

    console.log('🔍 OAuth Callback Debug:', {
      url: request.nextUrl.href,
      params,
      searchParams: Object.fromEntries(searchParams.entries()),
      allSearchParams: Array.from(searchParams.entries()),
      hasCode: !!params.code,
      hasState: !!params.state,
      codeLength: params.code?.length || 0,
      stateLength: params.state?.length || 0,
      // Log ALL possible parameters we might receive
      allParams: {
        code: params.code,
        state: params.state,
        error: params.error,
        error_description: params.error_description,
        success: params.success,
        userId: params.userId,
        toolkit: params.toolkit,
        connectionId: params.connectionId,
        message: params.message,
      }
    })
    
    // TEMPORARY: Log every single parameter that came in
    console.log('🔍 ALL URL PARAMETERS:', Object.fromEntries(searchParams.entries()))
    console.log('🔍 FULL CALLBACK URL:', request.nextUrl.href)
    console.log('🔍 REQUEST METHOD:', request.method)
    console.log('🔍 REQUEST HEADERS:', Object.fromEntries(request.headers.entries()))

    const parseResult = callbackParamsSchema.safeParse(params)

    if (!parseResult.success) {
      console.error('❌ Callback validation failed:', {
        errors: parseResult.error.errors,
        receivedParams: params,
        expectedSchema: 'code (string), state (string), error (optional string), error_description (optional string)'
      })
      return redirectWithError(request, `Invalid callback parameters: ${parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
    }

    const { code, state, error, error_description, success, userId, toolkit, connectionId, message } = parseResult.data

    // Detect if this is Composio hosted authentication or traditional OAuth
    const isComposioHosted = !!(success || userId || toolkit || connectionId)
    console.log(`🔍 Authentication type: ${isComposioHosted ? 'Composio Hosted' : 'Traditional OAuth'}`)

    if (isComposioHosted) {
      // Handle Composio hosted authentication
      console.log('✅ Composio hosted authentication detected')
      
      if (success === 'true' && toolkit && userId) {
        // Success case for hosted authentication
        const successScript = `
          <html>
            <head><title>Connection Successful</title></head>
            <body>
              <div style="text-align: center; padding: 50px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h2>🎉 Successfully connected ${toolkit}</h2>
                <p>This window will close automatically...</p>
              </div>
              <script>
                // Notify the opener window (your main app) that auth is complete
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'composio-auth-success',
                    toolkit: '${toolkit}',
                    connectionId: '${connectionId || ''}',
                    userId: '${userId}',
                    message: 'Successfully connected ${toolkit}'
                  }, '*');
                  window.close();
                }
              </script>
            </body>
          </html>
        `;
        
        return new NextResponse(successScript, {
          headers: { 'Content-Type': 'text/html' },
        });
      } else {
        // Error case for hosted authentication
        const errorMsg = message || 'Authentication failed'
        console.error('Composio hosted auth error:', errorMsg)
        return redirectWithError(request, errorMsg)
      }
    } else {
      // Handle traditional OAuth flow
      // Handle OAuth errors
      if (error) {
        const errorMessage = error_description || `OAuth error: ${error}`
        console.error('OAuth callback error:', errorMessage)
        return redirectWithError(request, errorMessage)
      }

      // Code and state are required for successful traditional OAuth
      if (!code || !state) {
        console.error('Missing authorization code or state in callback')
        return redirectWithError(request, 'Missing authorization code or state')
      }
    }

    // For traditional OAuth, decode state to get workspace and toolkit info
    let stateData: { userId: string; workspaceId: string; toolkit: string; source?: string } | null = null
    
    if (!isComposioHosted && state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
        stateData = {
          userId: decoded.userId,
          workspaceId: decoded.workspaceId,
          toolkit: decoded.toolkit,
          source: decoded.source || 'workspace', // Default to workspace for backward compatibility
        }
      } catch (error) {
        console.error('Failed to decode state:', error)
        return redirectWithError(request, 'Invalid state parameter')
      }
    } else if (isComposioHosted) {
      // For Composio hosted authentication, we already handled the success case above
      // This should not be reached, but just in case
      console.log('Composio hosted auth - no state decode needed')
      return redirectWithError(request, 'Unexpected flow for hosted authentication')
    } else {
      console.error('No state parameter for traditional OAuth')
      return redirectWithError(request, 'Missing state parameter')
    }

    // Validate state matches current user (only for traditional OAuth)
    if (!isComposioHosted && stateData) {
      if (stateData.userId !== session.user.id) {
        return redirectWithError(request, 'State validation failed')
      }

      // Verify workspace permissions
      const workspace = await getWorkspaceWithPermissions(
        parseInt(stateData.workspaceId), 
        parseInt(session.user.id)
      )
      
      if (!workspace) {
        return redirectWithError(request, 'Workspace not found')
      }

      // Check if user has permission to manage tools
      const userRole = workspace.owner_id === parseInt(session.user.id) ? 'owner' :
                      workspace.members?.find((m: any) => m.user_id === parseInt(session.user.id))?.role
      
      if (userRole !== 'owner' && userRole !== 'admin') {
        return redirectWithError(request, 'Insufficient permissions')
      }

      // Complete the OAuth connection with Composio
      const connectionResult = await completeConnection(
        code!,
        state!,
        session.user.id,
        stateData.workspaceId,
        workspace.type === 'personal'
      )

      // Update workspace_tools table with connection details
      await enableWorkspaceTool(
        parseInt(stateData.workspaceId),
        connectionResult.toolkit,
        parseInt(session.user.id),
        {
          connectionId: connectionResult.connectionId,
          connectionStatus: 'connected',
          lastSync: new Date().toISOString(),
          connectedAt: new Date().toISOString(),
        }
      )

        // Redirect based on source
        if (stateData.source === 'marketplace') {
          // For marketplace connections, close the popup window and redirect parent
          const successScript = `
            <html>
              <head><title>Connection Successful</title></head>
              <body>
                <div style="text-align: center; padding: 50px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <h2>🎉 Successfully connected ${connectionResult.toolkit}</h2>
                  <p>This window will close automatically...</p>
                </div>
                <script>
                  // Notify the opener window (your main app) that auth is complete
                  if (window.opener) {
                    window.opener.postMessage({ 
                      type: 'composio-auth-success',
                      toolkit: '${connectionResult.toolkit}',
                      message: 'Successfully connected ${connectionResult.toolkit}'
                    }, '*');
                    window.close();
                  }
                </script>
              </body>
            </html>
          `;
          
          return new NextResponse(successScript, {
            headers: { 'Content-Type': 'text/html' },
          });
        } else {
          // Default: redirect to workspace tools page
          const redirectUrl = new URL(`/workspaces/${stateData.workspaceId}/tools`, request.nextUrl.origin)
          redirectUrl.searchParams.set('success', 'true')
          redirectUrl.searchParams.set('toolkit', connectionResult.toolkit)
          redirectUrl.searchParams.set('message', `Successfully connected ${connectionResult.toolkit}`)
          
          return NextResponse.redirect(redirectUrl)
        }
      }

  } catch (error) {
    console.error('Composio callback error:', error)
    
    // Handle specific error types
    let errorMessage = 'Failed to complete connection'
    
    if (error instanceof Error) {
      if (error.message.includes('State validation failed')) {
        errorMessage = 'Security validation failed'
      } else if (error.message.includes('State expired')) {
        errorMessage = 'Connection request expired. Please try again.'
      } else if (error.message.includes('Failed to complete connection')) {
        errorMessage = 'Failed to establish connection with the service'
      }
    }

    return redirectWithError(request, errorMessage)
  }
}

/**
 * Helper function to redirect with error message
 */
function redirectWithError(request: NextRequest, error: string): NextResponse {
  // Try to extract workspace ID and source from state for better redirect
  let workspaceId: string | null = null
  let source = 'workspace'

  try {
    const state = request.nextUrl.searchParams.get('state')
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
      workspaceId = decoded.workspaceId || null
      source = decoded.source || 'workspace'
    }
  } catch {
    // Ignore decode errors, use default redirect
  }

  // For marketplace connections, return HTML with postMessage instead of redirecting
  if (source === 'marketplace') {
    const errorScript = `
      <html>
        <head><title>Connection Failed</title></head>
        <body>
          <div style="text-align: center; padding: 50px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h2>❌ Connection Failed</h2>
            <p>${error}</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            // Send error message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'composio-auth-error',
                error: '${error.replace(/'/g, "\\'")}',
                message: '${error.replace(/'/g, "\\'")}'
              }, '*');
            }
            // Close the popup window
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `;
    
    return new NextResponse(errorScript, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // For workspace connections, redirect normally
  let redirectUrl: URL
  if (workspaceId && !isNaN(parseInt(workspaceId))) {
    // Only redirect to workspace tools if we have a valid numeric workspace ID
    redirectUrl = new URL(`/workspaces/${workspaceId}/tools`, request.nextUrl.origin)
  } else {
    // Fallback: redirect to main dashboard when workspace ID is invalid
    redirectUrl = new URL('/dashboard', request.nextUrl.origin)
  }

  redirectUrl.searchParams.set('error', 'true')
  redirectUrl.searchParams.set('message', error)

  return NextResponse.redirect(redirectUrl)
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts GET requests.' },
    { status: 405 }
  )
}

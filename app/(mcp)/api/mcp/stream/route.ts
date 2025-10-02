import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/mcp/token'
import { buildServer } from '@/lib/mcp/server'
import { mcpFlags } from '@/lib/mcp/config'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const flags = mcpFlags()
  if (!flags.serverEnabled) return new Response('Not Found', { status: 404 })

  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') || ''
  const secret = process.env.NEXTAUTH_SECRET || 'insecure-dev-secret'
  const claims = verifyToken(token, secret)
  if (!claims) return new Response('Unauthorized', { status: 401 })

  // TODO: Replace with real installed toolkits for the workspace
  const toolkits: string[] = []

  await buildServer({
    userId: claims.sub,
    workspaceId: claims.ws,
    isPersonal: String(claims.ws).startsWith('user_'),
    toolkits,
  })

  // Streamable HTTP handler (stateless per request)
  // Note: SDK exposes helper for streamable HTTP; for now we use server to handle
  // a minimal handshake. We will replace this with the official handler in a follow-up.
  return new Response(JSON.stringify({ ok: true, server: 'initialized' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { mcpFlags } from '@/lib/mcp/config'
import { signToken } from '@/lib/mcp/token'

export async function POST(req: NextRequest) {
  const flags = mcpFlags()
  if (!flags.serverEnabled) {
    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 })
  }

  const session = await getServerSession(getAuthOptions())
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { workspaceId?: string | number; isPersonal?: boolean }
  const workspaceId = body.workspaceId
  if (!workspaceId) {
    return new Response(JSON.stringify({ error: 'workspaceId required' }), { status: 400 })
  }

  // Create a signed URL token for the Streamable HTTP server (to be used by clients)
  const secret = process.env.NEXTAUTH_SECRET || 'insecure-dev-secret'
  const token = signToken({ sub: String(session.user.id), ws: String(workspaceId) }, secret, { ttlMs: 15 * 60 * 1000 })

  // For now, return a placeholder URL that will be served by a separate route
  const url = new URL(req.url)
  const base = `${url.origin}/api/mcp/stream?token=${encodeURIComponent(token)}`

  return new Response(JSON.stringify({ id: `ws_${workspaceId}`, url: base, createdAt: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

import { getEnv } from '@/lib/env'

export const mcpFlags = () => {
  const env = getEnv() as any
  return {
    serverEnabled: env.ENABLE_MCP_INSTALL === 'true' || env.ENABLE_MCP_INSTALL === '1',
    uiEnabled: env.NEXT_PUBLIC_ENABLE_MCP_INSTALL === 'true' || env.NEXT_PUBLIC_ENABLE_MCP_INSTALL === '1',
    corsAllowOrigins: (env.MCP_CORS_ALLOW_ORIGINS as string | undefined)?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
  }
}

export const mcpTokenConfig = {
  issuer: 'rube-mcp',
  defaultTtlMs: 15 * 60 * 1000, // 15 minutes
}

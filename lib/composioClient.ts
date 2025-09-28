import { Composio } from '@composio/core'
import { aiConfig } from '@/lib/env'

export type ComposioConnectionResult = { redirectUrl: string; state: string; connectionId?: string }
export type ComposioConnectionStatus = {
  isConnected: boolean
  connectionId?: string
  connectedAccount?: string
  lastSync?: Date
  status: 'connected' | 'disconnected' | 'error' | 'expired'
}

export class ComposioClient {
  private composio: Composio

  constructor(apiKey = aiConfig().composio.apiKey) {
    if (!apiKey) throw new Error('Composio API key not configured')
    this.composio = new Composio({ apiKey })
  }

  async ensureAuthConfig(app: string): Promise<{ id: string }> {
    const existing = await this.composio.authConfigs.list()
    const items: any[] = (existing as any)?.items ?? (existing as any) ?? []
    const lower = app.toLowerCase()
    const found = items.find((c: any) =>
      (c.app?.toLowerCase?.() === lower) ||
      (c.name?.toLowerCase?.().includes(lower)) ||
      (c.toolkit?.slug?.toLowerCase?.() === lower)
    )
    if (found) return { id: found.id }
    const created = await this.composio.authConfigs.create(app.toUpperCase(), {
      name: `${app} Auth Config`,
      type: 'use_composio_managed_auth',
    } as any)
    return { id: (created as any).id }
  }

  async linkOAuth(userId: string, app: string, callbackUrl: string, state: string): Promise<ComposioConnectionResult> {
    const auth = await this.ensureAuthConfig(app)
    const req = await this.composio.connectedAccounts.link(userId, auth.id, { callbackUrl } as any)
    return { redirectUrl: (req as any).redirectUrl ?? (req as any).redirect_url, state, connectionId: (req as any).id }
  }

  async initiateApiKey(userId: string, app: string, kv: Record<string, string>): Promise<{ connectionId: string }> {
    // Create dedicated API_KEY auth config
    const created = await this.composio.authConfigs.create(app.toUpperCase(), {
      name: `${app} API Key Auth`,
      type: 'use_custom_auth',
      authScheme: 'API_KEY',
      credentials: {}
    } as any)
    const resp = await this.composio.connectedAccounts.initiate(userId, (created as any).id, {
      config: { authScheme: 'API_KEY' as any, val: kv as any },
    } as any)
    return { connectionId: (resp as any).id }
  }

  async getConnectionStatus(userId: string, toolkit: string): Promise<ComposioConnectionStatus> {
    try {
      const list = await this.composio.connectedAccounts.list()
      const items: any[] = (list as any)?.items ?? []
      const lower = toolkit.toLowerCase()
      const conn = items.find((c: any) => (c.userId === userId || c.user_id === userId || true) && (c.toolkit?.slug?.toLowerCase?.() === lower || c.app?.toLowerCase?.() === lower))
      if (!conn) return { isConnected: false, status: 'disconnected' }
      const raw = (conn.status || '').toUpperCase()
      const mapped: 'connected' | 'expired' | 'error' | 'disconnected' = raw === 'ACTIVE' || raw === 'ENABLED' || raw === 'CONNECTED'
        ? 'connected'
        : raw === 'EXPIRED'
        ? 'expired'
        : raw === 'FAILED'
        ? 'error'
        : 'disconnected'
      return {
        isConnected: mapped === 'connected',
        connectionId: conn.id,
        connectedAccount: conn.connectedAccountEmail || conn.connected_account_email || conn.email,
        ...(conn.last_sync ? { lastSync: new Date(conn.last_sync) } : {}),
        status: mapped,
      }
    } catch (e) {
      return { isConnected: false, status: 'error' }
    }
  }

  encodeState(
    userId: string,
    workspaceId: string,
    toolkit: string,
    source: 'workspace' | 'marketplace' = 'workspace'
  ): string {
    const data = { userId, workspaceId, toolkit, source, timestamp: Date.now(), nonce: Math.random().toString(36).slice(2) }
    return Buffer.from(JSON.stringify(data)).toString('base64url')
  }

  decodeState(state: string): { userId: string; workspaceId: string; toolkit: string; source: 'workspace' | 'marketplace'; timestamp: number } {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    return {
      userId: decoded.userId,
      workspaceId: decoded.workspaceId,
      toolkit: decoded.toolkit,
      source: (decoded.source as any) || 'workspace',
      timestamp: decoded.timestamp,
    }
  }

  async testApiKey(toolkit: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const created = await this.composio.authConfigs.create(toolkit.toUpperCase(), {
        name: `${toolkit} API Key Test`,
        type: 'use_custom_auth',
        authScheme: 'API_KEY',
        credentials: {}
      } as any)

      const apiKeyObject: any = { api_key: apiKey }
      await this.composio.connectedAccounts.initiate(`test_${Date.now()}`, (created as any).id, {
        config: { authScheme: 'API_KEY' as any, val: apiKeyObject },
      } as any)

      try { await (this.composio as any).authConfigs.delete((created as any).id) } catch {}
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Invalid API key' }
    }
  }
}

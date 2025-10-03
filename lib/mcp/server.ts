import { Server } from '@modelcontextprotocol/sdk/server'
import { z } from 'zod'
import { composioMarketplaceService } from '@/lib/services/composio-marketplace'
import { ComposioClient } from '@/lib/composioClient'
import { generateComposioUserId } from '@/lib/composio-utils'

type BuildOptions = {
  userId: string
  workspaceId: string | number
  isPersonal: boolean
  toolkits: string[] // toolkit slugs installed in the workspace
}

export async function buildServer(opts: BuildOptions) {
  const server = new Server({ name: 'rube-mcp', version: '1.0.0' }, { capabilities: { tools: {} } })

  // Build tool registry from installed toolkits
  const registry: Array<{
    name: string
    description?: string
    inputSchema: any
    toolkit: string
    action: string
  }> = []

  for (const toolkit of opts.toolkits) {
    const details = await composioMarketplaceService.getToolkitDetails(toolkit)
    const tools = details?.tools ?? []
    for (const t of tools) {
      registry.push({
        name: `${toolkit}_${t.name}`,
        description: t.description || `${toolkit} ${t.name}`,
        inputSchema: (t.parameters as any) ?? { type: 'object', properties: {} },
        toolkit,
        action: t.name,
      })
    }
  }

  // tools/list
  const ListToolsRequestSchema = z.object({ method: z.literal('tools/list'), params: z.any().optional() })
  server.setRequestHandler(ListToolsRequestSchema as any, async (_request) => {
    return {
      tools: registry.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    }
  })

  // tools/call
  const CallToolRequestSchema = z.object({
    method: z.literal('tools/call'),
    params: z
      .object({
        name: z.string(),
        arguments: z.record(z.unknown()).optional(),
        _meta: z.any().optional(),
      })
      .optional(),
  })
  server.setRequestHandler(CallToolRequestSchema as any, async (request: any) => {
    const { name, arguments: args } = request.params || { name: '', arguments: {} }
    const tool = registry.find(t => t.name === name)
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }
    const client = new ComposioClient()
    const composioUser = generateComposioUserId(opts.userId, opts.workspaceId, opts.isPersonal)
    const result = await client.executeAction(composioUser, tool.toolkit, tool.action, (args as any) ?? {})
    if (!result.success) {
      return { content: [{ type: 'text', text: result.error || 'Execution failed' }], isError: true as const }
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(result.data) }],
    }
  })

  return server
}

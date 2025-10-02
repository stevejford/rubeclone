import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { type Tool } from '@modelcontextprotocol/sdk/types'
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
  const server = new McpServer({ name: 'rube-mcp', version: '1.0.0' })

  // For each toolkit, register its tools dynamically
  for (const toolkit of opts.toolkits) {
    const details = await composioMarketplaceService.getToolkitDetails(toolkit)
    const tools = details?.tools ?? []
    for (const t of tools) {
      const toolName = `${toolkit}_${t.name}`
      server.tool(toolName as Tool['name'], {
        description: t.description || `${toolkit} ${t.name}`,
        inputSchema: t.parameters ?? { type: 'object', properties: {} },
        async handler(params) {
          const client = new ComposioClient()
          const composioUser = generateComposioUserId(opts.userId, opts.workspaceId, opts.isPersonal)
          const result = await client.executeAction(composioUser, toolkit, t.name, params as any)
          if (!result.success) {
            throw new Error(result.error || 'Execution failed')
          }
          return { content: [{ type: 'text', text: JSON.stringify(result.data) }] }
        }
      })
    }
  }

  return server
}

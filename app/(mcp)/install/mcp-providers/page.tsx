'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function MCPProvidersPage() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    // This flag is injected at build time for client
    setEnabled(process.env.NEXT_PUBLIC_ENABLE_MCP_INSTALL === 'true')
  }, [])

  if (!enabled) {
    return (
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold">MCP Providers</h1>
        <p className="text-gray-600 mt-2">This feature is currently disabled.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MCP Providers</h1>
        <p className="text-gray-600 mt-2">Create a Workspace MCP Server and connect your installed tools.</p>
      </div>

      <div className="prose max-w-none">
        <p>Follow the documentation in <code>docs/mcp/providers-guide.md</code>.</p>
        <ul>
          <li>Create a Workspace MCP server</li>
          <li>Connect required accounts</li>
          <li>Copy server URLs for Claude/Mastra</li>
        </ul>
        <p className="text-sm text-gray-500">Note: This page is a placeholder. Full UI will be implemented in the next PR.</p>
      </div>

      <div>
        <Link className="text-primary underline" href="/marketplace">Back to Marketplace</Link>
      </div>
    </div>
  )
}

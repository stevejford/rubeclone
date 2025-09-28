# MCP Providers

Composio provides Model Context Protocol (MCP) integration with various AI providers, allowing you to create MCP servers that can be used with different AI frameworks.

## Supported Providers

### Anthropic Provider

```javascript
import { Composio } from '@composio/core';
import { AnthropicProvider } from '@composio/anthropic';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Composio with the Anthropic provider
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new AnthropicProvider({ cacheTools: true }),
});

// Create MCP server with the new API structure
const mcpConfig = await composio.mcp.create({
  name: "Gmail Readonly Server",
  serverConfig: [
    {
      authConfigId: "<auth_config_id>", // Your auth config ID
      allowedTools: ["GMAIL_FETCH_EMAILS"]
    }
  ],
  options: {
    isChatAuth: true
  }
});

console.log(`✅ MCP server created: ${mcpConfig.id}`);
console.log(`🔧 Available toolkits: ${mcpConfig.toolkits.join(", ")}`);
```

### OpenAI Provider

```javascript
import { Composio } from '@composio/core';
import { OpenAIProvider } from '@composio/openai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new OpenAIProvider(),
});

// Create MCP server with new API structure
const mcpConfig = await composio.mcp.create({
  name: "Gmail Readonly Server",
  serverConfig: [
    {
      authConfigId: "<auth_config_id>", // Your auth config ID
      allowedTools: ["GMAIL_FETCH_EMAILS"]
    }
  ],
  options: {
    isChatAuth: true
  }
});
```

### Mastra Provider

```javascript
import { MastraProvider } from '@composio/mastra';
import { Composio } from '@composio/core';
import { MCPClient } from '@mastra/mcp';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import type { MastraMCPServerDefinition } from '@mastra/mcp';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new MastraProvider(),
});

// Create an MCP server with the Gmail toolkit using new API structure
const mcpConfig = await composio.mcp.create({
  name: "Gmail Readonly Server",
  serverConfig: [
    {
      authConfigId: "<auth_config_id>", // Your auth config ID
      allowedTools: ["GMAIL_FETCH_EMAILS"]
    }
  ],
  options: {
    isChatAuth: true
  }
});
```

## Key Features

- **Multi-Provider Support**: Works with Anthropic, OpenAI, Mastra, and other providers
- **Tool Caching**: Optimize performance with tool caching
- **Chat Authentication**: Enable chat-based authentication flows
- **Flexible Configuration**: Configure servers with specific tools and auth configs

## Usage Patterns

### Creating MCP Servers

All providers use the same API structure for creating MCP servers:

```javascript
const mcpConfig = await composio.mcp.create({
  name: "Server Name",
  serverConfig: [
    {
      authConfigId: "your_auth_config_id",
      allowedTools: ["TOOL_1", "TOOL_2"]
    }
  ],
  options: {
    isChatAuth: true
  }
});
```

### Connection Management

Check user connection status and handle authentication:

```javascript
// Check user connection status before proceeding
const connectionStatus = await composio.mcp.getUserConnectionStatus({
  id: mcpConfig.id,
  userId: "user@example.com"
});

if (!connectionStatus.connected) {
  console.log("❌ User needs to connect required accounts");
  // Handle authentication as needed
  return;
}
```

### Server Instance Retrieval

Get server instances for connected accounts:

```javascript
// Retrieve server instances for connected accounts
const serverInstances = await mcpConfig.getServer({
  userId: "user@example.com",
});

console.log("Server instances for connected accounts:", serverInstances);
```

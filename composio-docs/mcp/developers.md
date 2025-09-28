# MCP Developers Guide

Comprehensive guide for developers working with Composio's Model Context Protocol (MCP) integration.

## Getting Started

### Installation

```bash
npm install @composio/core
```

### Basic Setup

```javascript
import { Composio } from '@composio/core';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});
```

## Creating MCP Servers

### Basic Server Creation

```javascript
// Create an MCP server with the new API structure
const mcpConfig = await composio.mcp.create(
  "Gmail MCP Server",
  [
    {
      authConfigId: "ac_auth_12", // Your auth config ID
      allowedTools: [
        "GMAIL_FETCH_EMAILS",
        "GMAIL_CREATE_EMAIL_DRAFT",
        "GMAIL_SEND_EMAIL"
      ]
    }
  ],
  {
    isChatAuth: true // Enable chat-based authentication
  }
);

console.log(`✅ MCP server created: ${mcpConfig.id}`);
console.log(`🔧 Available toolkits: ${mcpConfig.toolkits.join(", ")}`);
```

### Advanced Configuration

```javascript
const mcpConfig = await composio.mcp.create({
  name: "Advanced Server",
  serverConfig: [
    {
      authConfigId: "auth_config_1",
      allowedTools: ["GMAIL_FETCH_EMAILS", "GMAIL_SEND_EMAIL"]
    },
    {
      authConfigId: "auth_config_2", 
      allowedTools: ["SLACK_SEND_MESSAGE", "SLACK_GET_CHANNELS"]
    }
  ],
  options: {
    isChatAuth: true,
    customSettings: {
      timeout: 30000,
      retries: 3
    }
  }
});
```

## Server Management

### Getting Server URLs

```javascript
// Get server URLs for a specific user
const serverUrls = await composio.mcp.getServer(
  mcpConfig.id,
  "user123@example.com"
);

console.log("Server URLs:", serverUrls);
```

### Server URL Format

```
https://mcp.composio.dev/composio/server/<UUID>/mcp?user_id=user123@example.com
```

### Retrieving Existing Servers

```javascript
// Retrieve a server by its name
const serverDetails = await composio.mcp.getByName("Gmail MCP Server");
console.log("Server details:", serverDetails);
```

### Listing Servers

```javascript
// List servers with filtering options
const servers = await composio.mcp.list({
  page: 1,
  limit: 10,
  toolkits: ["gmail", "slack"], // Filter by toolkits
  name: "production" // Filter by name
});

console.log("Found servers:", servers.items);
```

### Updating Servers

```javascript
// Update an existing server (uses traditional API signature)
const updatedServer = await composio.mcp.update(
  "server-uuid",
  "Updated Gmail Server",
  [
    {
      toolkit: "gmail",
      authConfigId: "ac_new_auth_config",
      allowedTools: ["GMAIL_FETCH_EMAILS", "GMAIL_SEND_EMAIL"]
    }
  ],
  { isChatAuth: true }
);
```

## Connection Management

### Checking Connection Status

```javascript
// Check if a user has connected accounts for all required toolkits
const connectionStatus = await composio.mcp.getUserConnectionStatus(
  "user123@example.com",
  mcpConfig.id
);

console.log("Overall connection status:", connectionStatus.connected);
console.log("Individual toolkit status:", connectionStatus.connectedToolkits);

// Handle missing connections
if (!connectionStatus.connected) {
  Object.entries(connectionStatus.connectedToolkits).forEach(([toolkit, status]) => {
    if (!status.connected) {
      console.log(`❌ ${toolkit} not connected`);
      // Guide user through authentication
    }
  });
}
```

### Authentication Flow

```javascript
// Check what authentication is needed
const authParams = await composio.mcp.getConnectionParams(
  mcpConfig.id,
  "gmail"
);

// Initiate authentication for a user
const authRequest = await composio.mcp.authorize(
  "user123@example.com",
  mcpConfig.id,
  "gmail"
);

if (authRequest.redirectUrl) {
  console.log("Please complete authentication:", authRequest.redirectUrl);
}
```

### Helper Actions for Authentication

```javascript
const serverUrls = await composio.mcp.getServer(
  mcpConfig.id,
  "user123@example.com"
);

// The server URLs will include helper actions that guide users through authentication
```

## Working with Existing Servers

### Finding Servers by Name

```javascript
// Find a server by name
const existingServer = await composio.mcp.getByName("Gmail Readonly Server");

// Check connection status for the existing server
const status = await composio.mcp.getUserConnectionStatus({
  id: existingServer.id,
  userId: "user123@example.com"
});

// Generate URLs for the existing server
const urls = await composio.mcp.getServer({
  id: existingServer.id,
  userId: "user123@example.com",
  options: {
    isChatAuth: true
  }
});
```

## Error Handling

### Common Error Patterns

```javascript
try {
  const mcpConfig = await composio.mcp.create({
    name: "Test Server",
    serverConfig: [
      {
        authConfigId: "invalid_config",
        allowedTools: ["INVALID_TOOL"]
      }
    ]
  });
} catch (error) {
  if (error.code === 'INVALID_AUTH_CONFIG') {
    console.error("Auth config not found:", error.message);
  } else if (error.code === 'INVALID_TOOL') {
    console.error("Tool not available:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Connection Error Handling

```javascript
const connectionStatus = await composio.mcp.getUserConnectionStatus({
  id: mcpConfig.id,
  userId: "user@example.com"
});

if (!connectionStatus.connected) {
  // Handle authentication requirements
  for (const [toolkit, status] of Object.entries(connectionStatus.connectedToolkits)) {
    if (!status.connected) {
      console.log(`Authentication required for ${toolkit}`);
      
      try {
        const authRequest = await composio.mcp.authorize({
          userId: "user@example.com",
          serverId: mcpConfig.id,
          toolkit: toolkit
        });
        
        if (authRequest.redirectUrl) {
          console.log(`Redirect to: ${authRequest.redirectUrl}`);
        }
      } catch (authError) {
        console.error(`Failed to initiate auth for ${toolkit}:`, authError);
      }
    }
  }
}
```

## Best Practices

### 1. Server Naming

Use descriptive names that indicate the server's purpose:

```javascript
const mcpConfig = await composio.mcp.create({
  name: "Production Gmail Integration Server",
  // ... rest of config
});
```

### 2. Tool Limitation

Limit tools to only what's necessary:

```javascript
serverConfig: [
  {
    authConfigId: "gmail_config",
    allowedTools: [
      "GMAIL_FETCH_EMAILS",  // Only include needed tools
      "GMAIL_SEND_EMAIL"
    ]
  }
]
```

### 3. Connection Status Checking

Always check connection status before using servers:

```javascript
const status = await composio.mcp.getUserConnectionStatus({
  id: serverId,
  userId: userId
});

if (status.connected) {
  const urls = await composio.mcp.getServer({ id: serverId, userId });
  // Use the server
} else {
  // Handle authentication
}
```

### 4. Error Handling

Implement comprehensive error handling:

```javascript
try {
  const result = await composio.mcp.create(config);
  return result;
} catch (error) {
  console.error("MCP server creation failed:", error);
  // Implement fallback or retry logic
  throw error;
}
```

## Integration Examples

### With Chat Applications

```javascript
// Create server for chat-based authentication
const chatServer = await composio.mcp.create({
  name: "Chat Assistant Server",
  serverConfig: [
    {
      authConfigId: "chat_auth_config",
      allowedTools: ["GMAIL_FETCH_EMAILS", "SLACK_SEND_MESSAGE"]
    }
  ],
  options: {
    isChatAuth: true  // Enable chat-based auth flow
  }
});
```

### With Web Applications

```javascript
// Create server for web application integration
const webServer = await composio.mcp.create({
  name: "Web App Integration",
  serverConfig: [
    {
      authConfigId: "web_auth_config", 
      allowedTools: ["GITHUB_CREATE_ISSUE", "LINEAR_CREATE_ISSUE"]
    }
  ],
  options: {
    isChatAuth: false,  // Use traditional OAuth flow
    webhookUrl: "https://myapp.com/webhook"
  }
});
```

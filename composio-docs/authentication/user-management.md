# User Management

This guide explains how to manage users and organizations in Composio, including different patterns for individual users vs. organization-wide tool access.

## Individual User Pattern

For applications where each user connects their own personal accounts:

### Connecting Individual Users

```javascript
// Use your database's user ID (UUID, primary key, etc.)
const userId = user.id; // e.g., "550e8400-e29b-41d4-a716-446655440000"

const tools = await composio.tools.get(userId, {
  toolkits: ['github'],
});

const result = await composio.tools.execute('GITHUB_GET_REPO', {
  userId: userId,
  arguments: { owner: 'example', repo: 'repo' },
});
```

### Individual User Implementation

```javascript
import { Composio } from '@composio/core';
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

// 1. User initiates GitHub connection
async function connectUserToGitHub(userId: string) {
  const connectionRequest = await composio.toolkits.authorize(userId, 'github');
  return connectionRequest.redirectUrl;
}

// 2. Get user's connected GitHub tools
async function getUserGitHubTools(userId: string) {
  return await composio.tools.get(userId, {
    toolkits: ['github'],
  });
}

// 3. Execute tool for specific user
async function getUserRepos(userId: string) {
  return await composio.tools.execute('GITHUB_LIST_REPOS', {
    userId: userId,
    arguments: {
      per_page: 10,
    },
  });
}

// Usage in your API endpoint
app.get('/api/github/repos', async (req, res) => {
  const userId = req.user.id; // Get from your auth system
  
  try {
    const repos = await getUserRepos(userId);
    res.json(repos.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repos' });
  }
});
```

## Organization Pattern

For applications where tools are shared across an organization:

### Organization-Wide Tool Access

```javascript
// Use the organization ID as userId
const userId = organization.id; // e.g., "org_550e8400"

// All users in the organization share the same connected accounts
const tools = await composio.tools.get(userId, {
  toolkits: ['slack'],
});

// Execute tools in the organization context
const result = await composio.tools.execute('SLACK_SEND_MESSAGE', {
  userId: userId,
  arguments: {
    channel: '#general',
    text: 'Hello from the team!',
  },
});
```

### Organization Implementation

```javascript
import { Composio } from '@composio/core';
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

// 1. Admin connects Slack for the entire organization
async function connectOrganizationToSlack(organizationId: string, adminUserId: string) {
  // Use organization ID as userId in Composio
  const connectionRequest = await composio.toolkits.authorize(organizationId, 'slack');
  
  // Store the connection request for the admin to complete
  await storeConnectionRequest(organizationId, adminUserId, connectionRequest);
  
  return connectionRequest.redirectUrl;
}

// 2. Any user in the organization can use the connected tools
async function sendSlackMessage(organizationId: string, channel: string, message: string) {
  return await composio.tools.execute('SLACK_SEND_MESSAGE', {
    userId: organizationId, // organization ID, not individual user ID
    arguments: {
      channel: channel,
      text: message,
    },
  });
}

// 3. Check if organization has required connections
async function getOrganizationTools(organizationId: string) {
  return await composio.tools.get(organizationId, {
    toolkits: ['slack', 'github', 'jira'],
  });
}

// Usage in your API endpoint
app.post('/api/slack/message', async (req, res) => {
  const { channel, message } = req.body;
  const organizationId = req.user.organizationId; // Get from your auth system
  
  // Verify user has permission to send messages for this organization
  // The userCanSendMessages function is your responsibility - implement it based on your application's permission model (role-based, feature flags, etc.).
  if (!(await userCanSendMessages(req.user.id, organizationId))) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  try {
    const result = await sendSlackMessage(organizationId, channel, message);
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});
```

## Mixed Pattern

You can combine both patterns in the same application:

### Correct Usage Pattern

```javascript
// ❌ Wrong: Using individual user ID for org-connected tool
const userTools = await composio.tools.get(req.user.id, {
  toolkits: ['slack'], // Fails - Slack is connected at org level
});

// ✅ Correct: Match the ID type to how the tool was connected
const userPersonalTools = await composio.tools.get(req.user.id, {
  toolkits: ['gmail'], // User's personal Gmail
});

const orgSharedTools = await composio.tools.get(req.user.organizationId, {
  toolkits: ['slack', 'jira'], // Organization's shared tools
});
```

## Key Concepts

### User ID Mapping

- **Individual Pattern**: Use your application's user ID directly
- **Organization Pattern**: Use your application's organization ID as the userId
- **Mixed Pattern**: Use appropriate ID based on how the tool was connected

### Permission Management

- Implement your own permission checks before executing tools
- Consider role-based access control for organization tools
- Validate user permissions at the API endpoint level

### Connection Management

- Store connection requests appropriately for your pattern
- Handle connection completion flows for both individual and organization contexts
- Provide clear UI for users to understand what they're connecting

## Best Practices

1. **Choose the Right Pattern**: Individual for personal tools, organization for shared tools
2. **Consistent ID Usage**: Always use the same ID type that was used to create the connection
3. **Permission Validation**: Implement proper authorization checks before tool execution
4. **Clear UX**: Make it obvious to users whether they're connecting personal or organization accounts
5. **Error Handling**: Provide clear error messages when connections are missing or permissions are insufficient

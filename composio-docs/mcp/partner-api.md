# MCP Partner API

The MCP Partner API provides access to Composio's toolkit catalog for partner integrations and third-party applications.

## Overview

The Partner API allows partners to:
- List available applications and toolkits
- Get application metadata and logos
- Access MCP server URLs for specific applications
- Integrate Composio's tools into their own platforms

## Base URL

```
https://mcp.composio.dev/api/partner/
```

## Authentication

Currently, the Partner API provides public endpoints for listing applications. Authentication may be required for advanced features in future versions.

## Endpoints

### List Applications

Get a list of all available applications in the Composio catalog.

**Endpoint:**
```
GET https://mcp.composio.dev/api/partner/lemon/apps/list
```

**cURL Example:**
```bash
curl -X GET https://mcp.composio.dev/api/partner/lemon/apps/list \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "items": [
    {
      "slug": "gmail",
      "name": "Gmail",
      "description": "Gmail is Google's email service, featuring spam protection, search functions, and seamless integration with other G Suite apps for productivity",
      "category": [
        "collaboration & communication"
      ],
      "logo": "https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/gmail.svg",
      "mcp_url": "https://mcp.composio.dev/partner/lemon/gmail",
      "tool_count": 23
    },
    {
      "slug": "slack",
      "name": "Slack", 
      "description": "Slack is a business communication platform offering organized conversations in channels, direct messaging, and integrations with third-party services",
      "category": [
        "collaboration & communication"
      ],
      "logo": "https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/slack.svg",
      "mcp_url": "https://mcp.composio.dev/partner/lemon/slack",
      "tool_count": 15
    },
    {
      "slug": "github",
      "name": "GitHub",
      "description": "GitHub is a web-based platform for version control and collaboration using Git, allowing developers to store, manage, and share code repositories",
      "category": [
        "development"
      ],
      "logo": "https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/github.svg",
      "mcp_url": "https://mcp.composio.dev/partner/lemon/github",
      "tool_count": 42
    }
  ]
}
```

## Response Fields

### Application Object

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Unique identifier for the application |
| `name` | string | Display name of the application |
| `description` | string | Brief description of the application's functionality |
| `category` | array | Categories the application belongs to |
| `logo` | string | URL to the application's logo/icon |
| `mcp_url` | string | MCP server URL for this application |
| `tool_count` | number | Number of available tools for this application |

## Categories

Applications are organized into the following categories:

- **collaboration & communication** - Email, messaging, and team collaboration tools
- **development** - Code repositories, CI/CD, and development tools
- **productivity** - Task management, note-taking, and productivity apps
- **crm** - Customer relationship management systems
- **marketing** - Marketing automation and analytics tools
- **finance** - Financial services and accounting tools
- **hr** - Human resources and recruitment platforms
- **social media** - Social networking and content management
- **e-commerce** - Online stores and payment processing
- **analytics** - Data analysis and business intelligence

## Usage Examples

### JavaScript/TypeScript

```javascript
async function getAvailableApps() {
  try {
    const response = await fetch('https://mcp.composio.dev/api/partner/lemon/apps/list');
    const data = await response.json();
    
    console.log('Available applications:', data.items.length);
    
    // Filter by category
    const devTools = data.items.filter(app => 
      app.category.includes('development')
    );
    
    console.log('Development tools:', devTools);
    
    return data.items;
  } catch (error) {
    console.error('Error fetching applications:', error);
  }
}
```

### Python

```python
import requests

def get_available_apps():
    try:
        response = requests.get('https://mcp.composio.dev/api/partner/lemon/apps/list')
        response.raise_for_status()
        
        data = response.json()
        apps = data['items']
        
        print(f'Available applications: {len(apps)}')
        
        # Filter by category
        comm_tools = [app for app in apps if 'collaboration & communication' in app['category']]
        print(f'Communication tools: {len(comm_tools)}')
        
        return apps
    except requests.RequestException as e:
        print(f'Error fetching applications: {e}')
        return []
```

### cURL with jq

```bash
# Get all applications
curl -s https://mcp.composio.dev/api/partner/lemon/apps/list | jq '.items'

# Get only application names and tool counts
curl -s https://mcp.composio.dev/api/partner/lemon/apps/list | \
  jq '.items[] | {name: .name, tools: .tool_count}'

# Filter by category
curl -s https://mcp.composio.dev/api/partner/lemon/apps/list | \
  jq '.items[] | select(.category[] | contains("development"))'
```

## Integration Patterns

### Building an App Directory

```javascript
function buildAppDirectory(apps) {
  return apps.map(app => ({
    id: app.slug,
    title: app.name,
    description: app.description,
    icon: app.logo,
    category: app.category[0], // Primary category
    toolCount: app.tool_count,
    mcpUrl: app.mcp_url
  }));
}
```

### Category-Based Navigation

```javascript
function groupByCategory(apps) {
  return apps.reduce((groups, app) => {
    app.category.forEach(cat => {
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(app);
    });
    return groups;
  }, {});
}
```

## Rate Limits

The Partner API currently has generous rate limits:
- 1000 requests per hour per IP address
- Burst limit of 100 requests per minute

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 1000,
      "window": "1h",
      "reset_time": "2024-01-01T12:00:00Z"
    }
  }
}
```

## Future Enhancements

Planned features for the Partner API include:

- Authentication for partner-specific features
- Webhook notifications for new applications
- Custom branding options for partners
- Analytics and usage metrics
- Application-specific tool listings
- Custom MCP server configurations

## Support

For Partner API support and integration assistance:

- Documentation: [https://docs.composio.dev](https://docs.composio.dev)
- GitHub Issues: [https://github.com/ComposioHQ/composio](https://github.com/ComposioHQ/composio)
- Discord Community: [Join our Discord](https://discord.gg/composio)

## Terms of Use

By using the Partner API, you agree to:
- Respect rate limits and usage guidelines
- Provide proper attribution when displaying Composio applications
- Not abuse or attempt to circumvent API limitations
- Comply with individual application terms of service

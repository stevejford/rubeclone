# Development Setup

This page provides comprehensive documentation for setting up Composio in your development environment.

## Installation

### Core SDK Installation

```bash
# Core SDK (includes OpenAI provider)
pip install composio==0.8.0

# Additional providers
pip install composio_anthropic==0.8.0
pip install composio_google==0.8.0
pip install composio_langchain==0.8.0
pip install composio_crewai==0.8.0
```

### JavaScript/TypeScript Installation

```bash
npm install @composio/core
```

## Basic Setup

### Python Setup

```python
from composio import Composio
from composio_openai import OpenAIProvider

composio = Composio(provider=OpenAIProvider())
```

### JavaScript Setup

```javascript
import { Composio } from '@composio/core';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});
```

## MCP Server Setup

### Creating an MCP Server

```javascript
const mcpServer = await composio.mcp.create({
  name: "personal-gmail-server",
  serverConfig: [
    {
      authConfigId: "your_auth_config_id",
      allowedTools: ["GMAIL_FETCH_EMAILS"]
    }
  ],
  options: {
    isChatAuth: true
  }
});
```

### Checking Connection Status

```javascript
// Check if user is authenticated
const status = await composio.mcp.getUserConnectionStatus({
  id: mcpServer.id,
  userId: "user@example.com"
});

if (status.connected) {
  const urls = await mcpServer.getServer({
    userId: "user@example.com"
  });
  console.log("Ready to use:", urls);
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Core Composio API Key
COMPOSIO_API_KEY=your_composio_api_key

# Provider-specific keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: Custom base URL
COMPOSIO_BASE_URL=https://api.composio.dev
```

### Configuration File

Create a `.composio` configuration file in your project root:

```json
{
  "api_key": "your_composio_api_key",
  "base_url": "https://api.composio.dev",
  "user_id": "default"
}
```

## Development Workflow

### 1. Initialize Composio

```python
from composio import Composio

composio = Composio(api_key="your-composio-api-key")
```

### 2. Get Tools

```python
tools = composio.tools.get(
    user_id="default", 
    toolkits=["GITHUB"]
)
```

### 3. Execute Tools

```python
result = composio.tools.execute(
    slug="GITHUB_GET_THE_ZEN_OF_GITHUB",
    user_id="default",
    arguments={}
)
```

## Authentication Setup

### OAuth Configuration

```python
from composio import Composio

composio = Composio()

# Use composio managed auth
auth_config = composio.auth_configs.create(
    toolkit="notion",
    options={
        "type": "use_composio_managed_auth",
        # "type": "use_custom_auth",
        # "auth_scheme": "OAUTH2",
        # "credentials": {
        #     "client_id": "1234567890",
        #     "client_secret": "1234567890",
        #     "oauth_redirect_uri": "https://backend.composio.dev/api/v3/toolkits/auth/callback",
        # }
    }
)
```

### Connection Management

```python
from composio import Composio

linear_auth_config_id = "ac_1234"
user_id = "user@email.com"
composio = Composio()

# Create a new connected account
connection_request = composio.connected_accounts.initiate(
    user_id=user_id,
    auth_config_id=linear_auth_config_id,
)
print(connection_request.redirect_url)

# Wait for the connection to be established
connected_account = connection_request.wait_for_connection()
```

## Testing Setup

### Unit Testing

```python
import pytest
from composio import Composio

@pytest.fixture
def composio_client():
    return Composio(api_key="test_api_key")

def test_tool_execution(composio_client):
    result = composio_client.tools.execute(
        slug="GITHUB_GET_THE_ZEN_OF_GITHUB",
        user_id="test_user",
        arguments={}
    )
    assert result is not None
```

### Integration Testing

```python
def test_github_integration():
    composio = Composio()
    tools = composio.tools.get(
        user_id="test_user",
        toolkits=["GITHUB"]
    )
    assert len(tools) > 0
```

## Debugging

### Enable Debug Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)

from composio import Composio
composio = Composio(debug=True)
```

### Error Handling

```python
try:
    result = composio.tools.execute(
        slug="INVALID_TOOL",
        user_id="default",
        arguments={}
    )
except Exception as e:
    print(f"Error: {e}")
```

## Best Practices

1. **Environment Variables**: Always use environment variables for API keys
2. **Error Handling**: Implement proper error handling for tool execution
3. **Rate Limiting**: Be aware of API rate limits
4. **Testing**: Write tests for your integrations
5. **Logging**: Enable logging for debugging purposes
6. **Version Pinning**: Pin specific versions in production

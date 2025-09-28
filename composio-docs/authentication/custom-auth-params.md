# Custom Auth Parameters

Guide to injecting custom credentials in headers or parameters for a toolkit. This is useful when you need to add custom authentication parameters that aren't part of the standard OAuth or API key flows.

## Overview

Custom auth parameters allow you to inject additional authentication data into tool requests. This is particularly useful for:

- Adding custom API keys to headers
- Injecting tenant-specific parameters
- Adding custom authentication tokens
- Implementing proprietary authentication schemes

## Using Custom Auth Parameters

### Basic Implementation

```python
from composio import Composio

composio = Composio()
```

### Before Execute Modifier for Custom Auth

```python
from composio import before_execute
from composio.types import ToolExecuteParams
import os

@before_execute(toolkits=["NOTION"])
def add_custom_auth(
    tool: str,
    toolkit: str,
    params: ToolExecuteParams,
) -> ToolExecuteParams:
    if params["custom_auth_params"] is None:
        params["custom_auth_params"] = {"parameters": []}

    params["custom_auth_params"]["parameters"].append(
        {
            "name": "x-api-key",
            "value": os.getenv("NOTION_API_KEY"),
            "in": "header",
        }
    )
    return params

result = composio.tools.execute(
    slug="NOTION_GET_DATABASE_ITEMS",
    user_id="default",
    arguments={},
    modifiers=[
        add_custom_auth,
    ],
)
print(result)
```

## Parameter Types

### Header Parameters

Add custom headers to requests:

```python
params["custom_auth_params"]["parameters"].append(
    {
        "name": "x-api-key",
        "value": "your-api-key",
        "in": "header",
    }
)
```

### Query Parameters

Add custom query parameters:

```python
params["custom_auth_params"]["parameters"].append(
    {
        "name": "api_key",
        "value": "your-api-key",
        "in": "query",
    }
)
```

### Body Parameters

Add custom body parameters:

```python
params["custom_auth_params"]["parameters"].append(
    {
        "name": "auth_token",
        "value": "your-token",
        "in": "body",
    }
)
```

## Common Use Cases

### 1. Custom API Key Headers

```python
@before_execute(toolkits=["CUSTOM_TOOLKIT"])
def add_api_key_header(tool: str, toolkit: str, params: ToolExecuteParams) -> ToolExecuteParams:
    if params["custom_auth_params"] is None:
        params["custom_auth_params"] = {"parameters": []}

    params["custom_auth_params"]["parameters"].append({
        "name": "X-API-Key",
        "value": os.getenv("CUSTOM_API_KEY"),
        "in": "header",
    })
    return params
```

### 2. Tenant-Specific Authentication

```python
@before_execute(toolkits=["MULTI_TENANT_APP"])
def add_tenant_auth(tool: str, toolkit: str, params: ToolExecuteParams) -> ToolExecuteParams:
    if params["custom_auth_params"] is None:
        params["custom_auth_params"] = {"parameters": []}

    params["custom_auth_params"]["parameters"].extend([
        {
            "name": "X-Tenant-ID",
            "value": os.getenv("TENANT_ID"),
            "in": "header",
        },
        {
            "name": "X-Tenant-Key",
            "value": os.getenv("TENANT_KEY"),
            "in": "header",
        }
    ])
    return params
```

### 3. Bearer Token Authentication

```python
@before_execute(toolkits=["BEARER_AUTH_APP"])
def add_bearer_token(tool: str, toolkit: str, params: ToolExecuteParams) -> ToolExecuteParams:
    if params["custom_auth_params"] is None:
        params["custom_auth_params"] = {"parameters": []}

    params["custom_auth_params"]["parameters"].append({
        "name": "Authorization",
        "value": f"Bearer {os.getenv('ACCESS_TOKEN')}",
        "in": "header",
    })
    return params
```

### 4. Multiple Authentication Methods

```python
@before_execute(toolkits=["COMPLEX_AUTH_APP"])
def add_multiple_auth(tool: str, toolkit: str, params: ToolExecuteParams) -> ToolExecuteParams:
    if params["custom_auth_params"] is None:
        params["custom_auth_params"] = {"parameters": []}

    # Add multiple authentication parameters
    auth_params = [
        {
            "name": "X-API-Key",
            "value": os.getenv("API_KEY"),
            "in": "header",
        },
        {
            "name": "X-Client-ID",
            "value": os.getenv("CLIENT_ID"),
            "in": "header",
        },
        {
            "name": "signature",
            "value": generate_signature(),  # Custom function
            "in": "query",
        }
    ]
    
    params["custom_auth_params"]["parameters"].extend(auth_params)
    return params
```

## Best Practices

1. **Environment Variables**: Always use environment variables for sensitive credentials
2. **Conditional Logic**: Add conditions to only apply auth when needed
3. **Error Handling**: Handle missing credentials gracefully
4. **Security**: Never hardcode credentials in your code
5. **Documentation**: Document custom auth requirements for your team

## Security Considerations

- Store sensitive credentials in environment variables or secure vaults
- Use HTTPS for all API communications
- Implement proper credential rotation
- Monitor for credential exposure in logs
- Use least-privilege access principles

## Troubleshooting

### Common Issues

1. **Missing Credentials**: Ensure environment variables are set
2. **Wrong Parameter Location**: Verify if auth should be in header, query, or body
3. **Parameter Naming**: Check API documentation for exact parameter names
4. **Encoding Issues**: Ensure proper encoding for special characters

### Debug Tips

```python
@before_execute(toolkits=["DEBUG_TOOLKIT"])
def debug_auth_params(tool: str, toolkit: str, params: ToolExecuteParams) -> ToolExecuteParams:
    print(f"Tool: {tool}")
    print(f"Toolkit: {toolkit}")
    print(f"Current params: {params}")
    
    # Add your custom auth logic here
    
    return params
```

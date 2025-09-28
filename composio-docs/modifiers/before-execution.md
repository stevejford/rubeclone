# Before Execution Modifiers

Before execution modifiers allow you to modify tool arguments before they are executed. This is useful for:

- Adding authentication parameters
- Validating or transforming input data
- Setting default values
- Implementing custom business logic

## Using Before Execute Modifiers

### Python Example

```python
from composio import before_execute
from composio.types import ToolExecuteParams

@before_execute(tools=["HACKERNEWS_GET_LATEST_POSTS"])
def before_execute_modifier(
    tool: str,
    toolkit: str,
    params: ToolExecuteParams,
) -> ToolExecuteParams:
    params["arguments"]["size"] = 1
    return params

# Get tools
tools = composio.tools.get(user_id=user_id, slug="HACKERNEWS_GET_LATEST_POSTS")
```

### Adding Custom Authentication

```python
from composio import before_execute
from composio.types import ToolExecuteParams

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

## Key Features

- **Parameter Modification**: Change tool arguments before execution
- **Authentication Injection**: Add custom auth headers or parameters
- **Validation**: Validate inputs before tool execution
- **Default Values**: Set default values for optional parameters
- **Business Logic**: Implement custom logic before tool execution

## Use Cases

1. **Custom Authentication**: Add API keys or custom headers
2. **Data Transformation**: Transform input data to match API requirements
3. **Validation**: Validate inputs before sending to external APIs
4. **Rate Limiting**: Implement custom rate limiting logic
5. **Logging**: Log tool execution for debugging and monitoring

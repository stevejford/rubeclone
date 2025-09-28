# After Execution Modifiers

After execution modifiers allow you to transform tool results after execution but before they are returned to the agent. This is useful for:

- Filtering sensitive data
- Transforming response format
- Adding computed fields
- Implementing custom response processing

## Using After Execute Modifiers

### Python Example

```python
from composio import after_execute
from composio.types import ToolExecutionResponse

@after_execute(tools=["HACKERNEWS_GET_USER"])
def after_execute_modifier(
    tool: str,
    toolkit: str,
    response: ToolExecutionResponse,
) -> ToolExecutionResponse:
    return {
        **response,
        "data": {
            "karma": response["data"]["karma"],
        },
    }

tools = composio.tools.get(user_id=user_id, slug="HACKERNEWS_GET_USER")
```

### Legacy ComposioToolSet Example

```python
from composio_openai import ComposioToolSet, Action

toolset = ComposioToolSet()

def my_postprocessor(result: dict) -> dict:
    # Transform the result
    return result

# Get tools with the modified schema
processed_tools = toolset.get_tools(
    actions=[Action.GMAIL_SEND_EMAIL],
    processors={
        # Applied AFTER the tool executes, BEFORE the result is returned
        "post": {Action.SOME_ACTION: my_postprocessor},
    },
)
```

## Key Features

- **Response Filtering**: Remove sensitive or unnecessary data
- **Data Transformation**: Transform response format to match agent expectations
- **Computed Fields**: Add calculated fields to responses
- **Error Handling**: Transform error responses for better agent understanding
- **Logging**: Log responses for debugging and monitoring

## Use Cases

1. **Data Privacy**: Filter out sensitive information from responses
2. **Response Formatting**: Transform responses to match expected formats
3. **Data Enrichment**: Add computed or derived fields to responses
4. **Error Normalization**: Standardize error responses across different tools
5. **Performance Metrics**: Add timing or performance data to responses
6. **Content Filtering**: Remove inappropriate or irrelevant content

## Best Practices

- Keep transformations lightweight to avoid performance impact
- Preserve essential data that agents need for decision making
- Use consistent response formats across similar tools
- Handle edge cases and error conditions gracefully
- Document any data transformations for debugging purposes

# Modifying Tool Outputs

## After Execute Modifier

Use the `@after_execute` decorator to modify tool outputs after execution:

```python
from composio import Composio, after_execute
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
# Get response from the LLM
response = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    tools=tools,
    messages=messages,
)
print(response)

# Execute the function calls.
result = composio.provider.handle_tool_calls(
  response=response,
  user_id="default",
  modifiers=[
     after_execute_modifier, 
  ]
)
print(result)
```

## Key Concepts

- **After Execute**: Modify responses after tool execution
- **Response Filtering**: Extract only relevant data from responses
- **Data Transformation**: Convert response formats
- **Error Handling**: Process and format error responses
- **Data Enrichment**: Add additional context to responses

## Use Cases

- Filtering sensitive data from responses
- Transforming response formats
- Adding computed fields
- Standardizing error messages
- Extracting specific data fields

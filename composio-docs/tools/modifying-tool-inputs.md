# Modifying Tool Inputs

## Before Execute Modifier

Use the `@before_execute` decorator to modify tool inputs before execution:

```python
from openai import OpenAI
from composio import Composio, before_execute
from composio.types import ToolExecuteParams

composio = Composio()
openai_client = OpenAI()
user_id = "user@email.com"

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

# Get response from the LLM
response = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    tools=tools,
    messages=[{"role": "user", "content": "Fetch latest posts from hackernews"}],
)
print(response)

# Execute the function calls.
result = composio.provider.handle_tool_calls(
    response=response,
    user_id="default",
    modifiers=[
        before_execute_modifier,
    ],
)
print(result)
```

## Key Concepts

- **Before Execute**: Modify parameters before tool execution
- **Tool Targeting**: Specify which tools the modifier applies to
- **Parameter Modification**: Change arguments, headers, or other execution parameters
- **Validation**: Ensure parameters meet specific requirements
- **Default Values**: Set default values for optional parameters

## Use Cases

- Setting default parameter values
- Validating input parameters
- Adding authentication headers
- Transforming parameter formats
- Enforcing business rules

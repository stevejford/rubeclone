# Migration Guide

This guide helps you migrate from older versions of Composio to the latest version, including API changes and new features.

## Upgrading to v0.8.0

### Installation

```bash
pip install -U composio
```

## API Changes

### From ComposioToolSet to Composio Class

**Old API (Deprecated):**
```python
from composio_openai import ComposioToolSet, Action, App
from openai import OpenAI

toolset = ComposioToolSet()
client = OpenAI()

tools = toolset.get_tools(
    actions=[Action.GITHUB_GET_THE_AUTHENTICATED_USER], 
    check_connected_accounts=True
)

tools = toolset.get_tools(
    apps=[App.GITHUB, App.LINEAR, App.SLACK], 
    check_connected_accounts=True
)
```

**New API (Recommended):**
```python
from composio import Composio
# from composio_langchain import LangchainProvider

composio = Composio()
# composio = Composio(provider=LangchainProvider())

tools = composio.tools.get(
    user_id="0001",
    tools=["LINEAR_CREATE_LINEAR_ISSUE", "GITHUB_CREATE_COMMIT"]
)
# tools returned is formatted for the provider. by default, OpenAI.
```

### Tool Fetching Changes

**Old API:**
```python
from composio_openai import ComposioToolSet, Action, App

toolset = ComposioToolSet()

tools = toolset.get_tools(
    actions=[Action.GITHUB_GET_THE_AUTHENTICATED_USER], 
    check_connected_accounts=True
)
```

**New API:**
```python
from composio import Composio

composio = Composio()
user_id = "user@acme.org"

# Get tools by toolkit
tools_1 = composio.tools.get(user_id=user_id, toolkits=["GITHUB", "LINEAR"])

# Get limited tools
tools_2 = composio.tools.get(user_id=user_id, toolkits=["SLACK"], limit=5)

# Get specific tools
tools_3 = composio.tools.get(
    user_id=user_id,
    tools=["GITHUB_CREATE_AN_ISSUE", "GITHUB_CREATE_AN_ISSUE_COMMENT", "GITHUB_CREATE_A_COMMIT"],
)

# Search for tools
tools_4 = composio.tools.get(user_id="john", search="hackernews posts")
```

### Raw Tool Access

**Old and New API (Unchanged):**
```python
from composio import Composio

composio = Composio()

tool = composio.tools.get_raw_composio_tool_by_slug("HACKERNEWS_GET_LATEST_POSTS")
print(tool.model_dump_json())
```

### Tool Execution

**Old API:**
```python
from composio_openai import ComposioToolSet

toolset = ComposioToolSet()
result = toolset.execute_action(
    action=Action.GITHUB_GET_THE_ZEN_OF_GITHUB,
    params={},
    entity_id="default"
)
```

**New API:**
```python
from composio import Composio
from openai import OpenAI

openai_client = OpenAI()
composio = Composio()

tools = composio.tools.get(user_id="user@acme.com", tools=["GITHUB_GET_THE_ZEN_OF_GITHUB"])
response = openai_client.chat.completions.create(
    model="gpt-4.1",
    messages=[{"role": "user", "content": "gimme some zen."}],
    tools=tools,
)

result = composio.provider.handle_tool_calls(user_id="user@acme.com", response=response)
print(result)
```

## Modifier System Changes

### Schema Modifiers

**Old API:**
```python
from composio_openai import ComposioToolSet, Action

toolset = ComposioToolSet()

def my_schema_processor(schema: dict) -> dict: 
    # Process schema
    return schema

processed_tools = toolset.get_tools(
    actions=[Action.GMAIL_SEND_EMAIL],
    processors={
        "schema": {Action.SOME_ACTION: my_schema_processor},
    },
)
```

**New API:**
```python
from composio import Composio, schema_modifier
from composio.types import Tool

user_id = "your@email.com"

@schema_modifier(tools=["HACKERNEWS_GET_LATEST_POSTS"])
def modify_schema(
    tool: str,
    toolkit: str,
    schema: Tool,
) -> Tool:
    _ = schema.input_parameters["properties"].pop("page", None)
    schema.input_parameters["required"] = ["size"]
    return schema

tools = composio.tools.get(
    user_id=user_id,
    tools=["HACKERNEWS_GET_LATEST_POSTS", "HACKERNEWS_GET_USER"],
    modifiers=[modify_schema]
)
```

### Before/After Execute Modifiers

**Old API:**
```python
def my_preprocessor(inputs: dict) -> dict: 
    # Process inputs
    return inputs

def my_postprocessor(result: dict) -> dict: 
    # Process result
    return result

processed_tools = toolset.get_tools(
    actions=[Action.GMAIL_SEND_EMAIL],
    processors={
        "pre": {Action.SOME_ACTION: my_preprocessor},
        "post": {Action.SOME_ACTION: my_postprocessor},
    },
)
```

**New API:**
```python
from composio import before_execute, after_execute

@before_execute(tools=["HACKERNEWS_GET_LATEST_POSTS"])
def before_execute_modifier(tool: str, toolkit: str, params: ToolExecuteParams) -> ToolExecuteParams:
    params["arguments"]["size"] = 1
    return params

@after_execute(tools=["HACKERNEWS_GET_USER"])
def after_execute_modifier(tool: str, toolkit: str, response: ToolExecutionResponse) -> ToolExecutionResponse:
    return {
        **response,
        "data": {"karma": response["data"]["karma"]},
    }
```

## Custom Tools Migration

**Old API:**
```python
from composio import action, ComposioToolSet
import typing as t

toolset = ComposioToolSet()

@action(toolname="github")
def get_github_repo_topics(
    owner: t.Annotated[str, "Repository owner username"],
    repo: t.Annotated[str, "Repository name"],
    execute_request: t.Callable
) -> dict:
    """Gets the topics associated with a specific GitHub repository."""
    response_data = execute_request(
        endpoint=f"/repos/{owner}/{repo}/topics",
        method="GET"
    )
    if isinstance(response_data, dict):
        return {"topics": response_data.get("names", [])}
```

**New API:**
```python
from pydantic import BaseModel, Field
from composio import Composio
from composio.core.models.custom_tools import ExecuteRequestFn

composio = Composio()

class GetIssueInfoInput(BaseModel):
    issue_number: int = Field(
        ...,
        description="The number of the issue to get information about",
    )

@composio.tools.custom_tool(toolkit="github")
def get_issue_info(
    request: GetIssueInfoInput,
    execute_request: ExecuteRequestFn,
    auth_credentials: dict,
) -> dict:
    """Get information about a GitHub issue."""
    response = execute_request(
        endpoint=f"/repos/composiohq/composio/issues/{request.issue_number}",
        method="GET",
        parameters=[
            {
                "name": "Accept",
                "value": "application/vnd.github.v3+json",
                "type": "header",
            },
            {
                "name": "Authorization",
                "value": f"Bearer {auth_credentials['access_token']}",
                "type": "header",
            },
        ],
    )
    return {"data": response.data}
```

## Breaking Changes

1. **ComposioToolSet Deprecation**: The `ComposioToolSet` class is deprecated in favor of the `Composio` class
2. **Action/App Enums**: Direct use of `Action` and `App` enums is replaced with string-based tool/toolkit names
3. **Entity ID**: The `entity_id` parameter is replaced with `user_id`
4. **Processor System**: The processor system is replaced with decorators (`@schema_modifier`, `@before_execute`, `@after_execute`)
5. **Tool Execution**: Tool execution now uses the provider's `handle_tool_calls` method

## Migration Checklist

- [ ] Update Composio package to v0.8.0
- [ ] Replace `ComposioToolSet` with `Composio` class
- [ ] Update tool fetching to use new API
- [ ] Migrate processors to modifier decorators
- [ ] Update custom tool definitions
- [ ] Replace `entity_id` with `user_id`
- [ ] Update tool execution patterns
- [ ] Test all integrations thoroughly

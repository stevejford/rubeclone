# Fetching and Filtering Tools

Learn how to fetch and filter Composio's tools and toolkits to get exactly what you need for your AI agents.

## Basic Tool Fetching

### Get Tools by Toolkit

```python
tools = composio.tools.get(
    user_id,
    toolkits=["GITHUB", "HACKERNEWS"],
)
```

### Get Limited Number of Tools

```python
tools = composio.tools.get(
    user_id,
    toolkits=["GITHUB"],
    limit=5,  # Returns the top 5 important tools from the toolkit
)
```

### Get Tools with Specific Scopes

```python
# Get GitHub tools that require specific scopes
tools = composio.tools.get(
    user_id,
    toolkits=["GITHUB"],
    scopes=["repo"],  # Only get tools requiring these scopes
    limit=10
)
```

## Specific Tool Selection

### Get Specific Tools by Name

```python
tools = composio.tools.get(
    user_id,
    tools=[
        "GITHUB_CREATE_AN_ISSUE",
        "GITHUB_CREATE_AN_ISSUE_COMMENT",
        "GITHUB_CREATE_A_COMMIT",
    ],
)
```

### Get Raw Tool Information

```python
tool = composio.tools.get_raw_composio_tool_by_slug("HACKERNEWS_GET_LATEST_POSTS")

print(tool.model_dump_json())
```

## Search-Based Tool Discovery

### Search Tools by Description

```python
tools = composio.tools.get(
    user_id,
    search="hubspot organize contacts",
)

# Search within a specific toolkit
tools = composio.tools.get(
    user_id,
    search="repository issues",
    toolkits=["GITHUB"],  # Optional: limit search to specific toolkit
    limit=5  # Optional: limit number of results
)
```

## Filter Options

### By Tools
```python
{ tools: ["TOOL_1", "TOOL_2"] }
```

### By Toolkits
```python
{ toolkits: ["TOOLKIT_1", "TOOLKIT_2"], limit?: number }
```

### By Scopes
```python
{ toolkits: ["GITHUB"], scopes: ["read:repo"], limit?: number }
```

### By Search Query
```python
{ search: "query", toolkits?: string[], limit?: number }
```

## Python SDK Examples

### Basic Usage

```python
from openai import OpenAI
from composio import Composio

# Initialize tools.
openai_client = OpenAI()
composio = Composio(api_key="your-composio-api-key")

# Define task.
task = "Star a repo composiohq/composio on GitHub"

# Get GitHub tools that are pre-configured
tools = composio.tools.get(user_id="default", toolkits=["GITHUB"])

# Get response from the LLM
response = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    tools=tools,
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": task},
    ],
)
print(response)

# Execute the function calls.
result = composio.provider.handle_tool_calls(response=response, user_id="default")
print(result)
```

### Installation

```bash
# Core SDK (includes OpenAI provider)
pip install composio==0.8.0

# Additional providers
pip install composio_anthropic==0.8.0
pip install composio_google==0.8.0
pip install composio_langchain==0.8.0
pip install composio_crewai==0.8.0
```

### Provider Configuration

```python
from composio import Composio
from composio_openai import OpenAIProvider

composio = Composio(provider=OpenAIProvider())
```

## Best Practices

1. **Use Specific Tools**: When possible, specify exact tools rather than entire toolkits
2. **Limit Results**: Use the `limit` parameter to avoid overwhelming your agent
3. **Search Functionality**: Use search to discover relevant tools for specific tasks
4. **Scope Filtering**: Filter by scopes to ensure you have the right permissions
5. **Toolkit Organization**: Group related tools by toolkit for better organization

## Common Use Cases

- **GitHub Integration**: Get repository management tools
- **Email Automation**: Fetch Gmail or email-related tools
- **CRM Operations**: Search for customer management tools
- **Social Media**: Get tools for posting and managing social accounts
- **File Management**: Tools for cloud storage and file operations

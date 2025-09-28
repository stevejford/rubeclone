# Executing Tools

## Basic Tool Execution with OpenAI

```python
from composio import Composio
from composio_openai import OpenAIProvider
from openai import OpenAI
from datetime import datetime

# Use a unique identifier for each user in your application
user_id = "user-k7334" 

# Create composio client
composio = Composio(provider=OpenAIProvider(), api_key="your_composio_api_key")

# Create openai client
openai = OpenAI()

# Get calendar tools for this user
tools = composio.tools.get(
  user_id=user_id,
  tools=["GOOGLECALENDAR_EVENTS_LIST"]
)

# Ask the LLM to check calendar
result = openai.chat.completions.create(
  model="gpt-4o-mini",
  tools=tools,
  messages=[
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": f"What's on my calendar for the next 7 days. Its {datetime.now().strftime('%Y-%m-%d')} today.",}
  ]
)

# Handle tool calls
result = composio.provider.handle_tool_calls(user_id=user_id, response=result)
print(result)
```

## Using with OpenAI Agents

```python
import asyncio
from agents import Agent, Runner
from composio import Composio
from composio_openai_agents import OpenAIAgentsProvider

# Use a unique identifier for each user in your application
user_id = "user-k7334"

# Initialize Composio toolset
composio = Composio(provider=OpenAIAgentsProvider(), api_key="your_composio_api_key")

# Get all tools for the user
tools = composio.tools.get(
  user_id=user_id,
  toolkits=["COMPOSIO_SEARCH"],
)

# Create an agent with the tools
agent = Agent(
  name="Deep Researcher",
  instructions="You are an investigative journalist.",
  tools=tools,
)

async def main():
  result = await Runner.run(
      starting_agent=agent,
      input=("Do a thorough DEEP research on Golden Gate Bridge"),
  )
  print(result.final_output)

# Run the agent
asyncio.run(main())
```

## Direct Tool Execution

```python
from composio import Composio

user_id = "user-k7334"
composio = Composio(api_key="your_composio_key")

# Find available arguments for any tool in the Composio dashboard
result = composio.tools.execute(
  "GITHUB_LIST_STARGAZERS",
  user_id=user_id,
  arguments={"owner": "ComposioHQ", "repo": "composio", "page": 1, "per_page": 5}
)
print(result)
```

## Proxy Requests

```python
# Send a proxy request to the endpoint
response = composio.tools.proxy(
  endpoint="/repos/composiohq/composio/issues/1",
  method="GET",
  connected_account_id="ca_jI6********",  # use connected account for github
  parameters=[
      {
          "name": "Accept",
          "value": "application/vnd.github.v3+json",
          "type": "header",
      },
  ],
)

print(response)
```

## File Operations

### File Upload

```python
# Upload a local file to Google Drive
result = composio.tools.execute(
  slug="GOOGLEDRIVE_UPLOAD_FILE",
  user_id="user-1235***",
  arguments={"file_to_upload": os.path.join(os.getcwd(), "document.pdf")},  # Local file path
)

print(result)  # Print Google Drive file details
```

### File Download

```python
composio = Composio(
  api_key="your_composio_key", file_download_dir="./downloads"
)  # Optional: Specify the directory to download files to

result = composio.tools.execute(
  "GOOGLEDRIVE_DOWNLOAD_FILE",
  user_id="user-1235***",
  arguments={"file_id": "your_file_id"},
)

# Result includes local file path
print(result)
```

## Manual File Handling (JavaScript)

```javascript
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  autoUploadDownloadFiles: false
});

// Now you need to handle files manually using composio.files API
const fileData = await composio.files.upload({
  filePath: path.join(__dirname, 'document.pdf'),
  toolSlug: 'GOOGLEDRIVE_UPLOAD_FILE',
  toolkitSlug: 'googledrive'
});
```

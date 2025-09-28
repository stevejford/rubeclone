# Using Triggers

## Creating Triggers

```python
from composio import Composio

composio = Composio(api_key="your-api-key")
user_id = "user-id-123435"

# Check what configuration is required
trigger_type = composio.triggers.get_type("GITHUB_COMMIT_EVENT")
print(trigger_type.config)
# Returns: {"properties": {...}, "required": ["owner", "repo"], ...}

# Create trigger with the required config
trigger = composio.triggers.create(
    slug="GITHUB_COMMIT_EVENT",
    user_id=user_id,
    trigger_config={"owner": "your-repo-owner", "repo": "your-repo-name"},
)
print(f"Trigger created: {trigger.trigger_id}")
```

## Setting Up Webhook Handler

```python
from fastapi import FastAPI, Request
from typing import Dict, Any
import uvicorn
import json

app = FastAPI(title="Webhook Demo")

@app.post("/webhook")
async def webhook_handler(request: Request):
    # Get the raw payload
    payload = await request.json()
    
    # Log the received webhook data
    print("Received webhook payload:")
    print(json.dumps(payload, indent=2))
    
    # Return a success response
    return {"status": "success", "message": "Webhook received"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Subscribing to Trigger Events

```python
from composio import Composio

# Initialize Composio client
composio = Composio(api_key="your_api_key_here")

# Subscribe to trigger events
subscription = composio.triggers.subscribe()

# Define event handler
@subscription.handle(trigger_id="your_trigger_id")
def handle_github_commit(data):
  print(f"New commit detected: {data}")
  # Add your custom logic here

# Note: For production use, set up webhooks instead
```

## Inspecting Trigger Payload

```python
# Get trigger type to inspect payload structure
trigger = composio.triggers.get_type(slug="GITHUB_COMMIT_EVENT")
print(trigger.payload)
```

## TypeScript Example

```typescript
// Define type-safe payload for GitHub Star Added event
export type GitHubStarAddedEventPayload = {
  action: "created";
  repository_id: number;
  repository_name: string;
  repository_url: string;
  starred_at: string;
  starred_by: string;
};

const composio = new Composio();
const userId = 'user@acme.com';

// Create the trigger
const createResponse = await composio.triggers.create(userId, 'GITHUB_STAR_ADDED_EVENT', {
  triggerConfig: {
    owner: 'composiohq',
    repo: 'composio',
  },
});

// Fetch trigger type details
const triggerType = await composio.triggers.getType("GITHUB_STAR_ADDED_EVENT");
console.log(triggerType.config);
```

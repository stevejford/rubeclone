# Custom Auth Configs

## Callback URL

The default callback URL for Composio is:
```
https://backend.composio.dev/api/v3/toolkits/auth/callback
```

## Creating Connected Accounts

```python
# Create a new connected account
connection_request = composio.connected_accounts.initiate(
    user_id="user_id",
    auth_config_id="ac_1234",
)
print(connection_request)

# Wait for the connection to be established
connected_account = connection_request.wait_for_connection()
print(connected_account)
```

## Custom Redirect URL

You can set up a custom redirect URL for your application:

```
https://yourdomain.com/api/composio-redirect
```

## FastAPI Integration Example

```python
from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from composio import Composio

# Create a FastAPI app
app = FastAPI()

# Create a Composio client
composio = Composio()


@app.get("/authorize/{toolkit}")
def authorize_app(toolkit: str):
    # retrieve the user id from your app
    user_id = "<user_id>"

    # retrieve the auth config id from your app
    auth_config_id = "<auth_config_id>"

    # initiate the connection request
    connection_request = composio.connected_accounts.initiate(
        user_id=user_id,
        auth_config_id=auth_config_id,
    )
    return RedirectResponse(url=connection_request.redirect_url)
```

## Key Concepts

- **Auth Config ID**: Unique identifier for authentication configurations
- **User ID**: Your application's user identifier
- **Connection Request**: Initiates the authentication flow
- **Redirect URL**: Where users are sent after authentication
- **Connected Account**: Represents an authenticated connection

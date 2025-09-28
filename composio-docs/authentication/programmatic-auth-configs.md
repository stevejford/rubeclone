# Programmatic Auth Configs

## Composio Managed Auth

```python
from composio import Composio

composio = Composio()

# Use composio managed auth
auth_config = composio.auth_configs.create(
    toolkit="github",
    options={
        "type": "use_composio_managed_auth",
    },
)
print(auth_config)
```

## Custom OAuth2 Auth

```python
# Use custom auth
auth_config = composio.auth_configs.create(
    toolkit="notion",
    options={
        "name": "Notion Auth",
        "type": "use_custom_auth",
        "auth_scheme": "OAUTH2",
        "credentials": {
            "client_id": "1234567890",
            "client_secret": "1234567890",
        },
    },
)
print(auth_config)
```

## Callback URL

The default callback URL is:
```
https://backend.composio.dev/api/v3/toolkits/auth/callback
```

## HubSpot Example with Scopes

```python
from composio import Composio

composio = Composio()

response = composio.auth_configs.create(
    toolkit="HUBSPOT",
    options={
        "name": "HubspotConfig",
        "authScheme": "OAUTH2",
        "type": "use_composio_managed_auth",
        "credentials": {
            "scopes": "sales-email-read,tickets"
        }
    }
)

print(response.id)
```

## API Key Authentication

```python
# Use custom auth
auth_config = composio.auth_configs.create(
    toolkit="perplexityai",
    options={
        "type": "use_custom_auth",
        "auth_scheme": "API_KEY",
        "credentials": {}
    },
)
print(auth_config)
```

## Getting Required Fields

```python
required_fields = composio.toolkits.get_auth_config_creation_fields(
    toolkit="NOTION",
    auth_scheme="OAUTH2",
    required_only=True,
)
print(required_fields)
```

## Auth Schemes

- **OAUTH2**: OAuth 2.0 authentication flow
- **API_KEY**: Simple API key authentication
- **BASIC**: Basic HTTP authentication
- **BEARER**: Bearer token authentication

## Configuration Types

- **use_composio_managed_auth**: Use Composio's managed authentication
- **use_custom_auth**: Use your own authentication credentials

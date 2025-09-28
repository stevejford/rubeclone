import { Composio } from '@composio/core';
import { aiConfig } from './env';

/**
 * Composio MCP Client following the official MCP documentation
 * Uses the @composio/core SDK for proper MCP server management
 */
export class ComposioMCPClient {
  private composio: Composio;
  private mcpServers: Map<string, string> = new Map(); // toolkit -> serverId

  constructor() {
    const config = aiConfig();
    if (!config.composio.enabled || !config.composio.apiKey) {
      throw new Error('Composio API key not configured');
    }

    this.composio = new Composio({
      apiKey: config.composio.apiKey,
    });
  }

  /**
   * Create or get MCP server for a toolkit
   * Following the MCP documentation pattern
   */
  async getOrCreateMCPServer(toolkit: string): Promise<string> {
    // Check if we already have a server for this toolkit
    if (this.mcpServers.has(toolkit)) {
      return this.mcpServers.get(toolkit)!;
    }

    try {
      // Create auth config for the toolkit
      const authConfig = await this.createAuthConfig(toolkit);

      // Create MCP server with the new API structure
      const mcpConfig = await this.composio.mcp.create(
        `${toolkit.charAt(0).toUpperCase() + toolkit.slice(1)} MCP Server`,
        {
          toolkits: [
            {
              toolkit: toolkit,
              authConfigId: authConfig.id
            }
          ],
          allowedTools: await this.getToolkitTools(toolkit)
        }
      );

      console.log(`✅ MCP server created for ${toolkit}: ${mcpConfig.id}`);
      this.mcpServers.set(toolkit, mcpConfig.id);
      return mcpConfig.id;
    } catch (error) {
      console.error(`Failed to create MCP server for ${toolkit}:`, error);
      throw error;
    }
  }

  /**
   * Create auth config for a toolkit using the correct API from documentation
   */
  private async createAuthConfig(toolkit: string) {
    try {
      console.log(`🔧 Creating auth config for ${toolkit} using Composio managed auth...`);

      // Use the correct API structure from the documentation
      const authConfig = await this.composio.authConfigs.create(toolkit.toUpperCase(), {
        name: `${toolkit.charAt(0).toUpperCase() + toolkit.slice(1)} Auth Config`,
        type: 'use_composio_managed_auth',
      });

      console.log(`✅ Auth config created for ${toolkit}: ${authConfig.id}`);
      return authConfig;
    } catch (error) {
      console.error(`Failed to create auth config for ${toolkit}:`, error);
      throw error;
    }
  }

  /**
   * Get available tools for a toolkit
   */
  private async getToolkitTools(toolkit: string): Promise<string[]> {
    try {
      // For now, return default tools as the API structure has changed
      // TODO: Update this when the correct API is available
      return this.getDefaultTools(toolkit);
    } catch (error) {
      console.error(`Failed to get tools for ${toolkit}:`, error);
      // Return some common tools as fallback
      return this.getDefaultTools(toolkit);
    }
  }

  /**
   * Get default tools for common toolkits
   */
  private getDefaultTools(toolkit: string): string[] {
    const defaultTools: Record<string, string[]> = {
      gmail: [
        'GMAIL_FETCH_EMAILS',
        'GMAIL_CREATE_EMAIL_DRAFT',
        'GMAIL_SEND_EMAIL'
      ],
      github: [
        'GITHUB_CREATE_ISSUE',
        'GITHUB_GET_REPO',
        'GITHUB_CREATE_PR'
      ],
      notion: [
        'NOTION_CREATE_PAGE',
        'NOTION_GET_PAGE',
        'NOTION_UPDATE_PAGE'
      ],
      slack: [
        'SLACK_SEND_MESSAGE',
        'SLACK_GET_CHANNELS',
        'SLACK_GET_USERS'
      ]
    };

    return defaultTools[toolkit] || [];
  }

  /**
   * Get server URLs for a user
   */
  async getServerUrls(toolkit: string, _userId: string): Promise<any> {
    try {
      const serverId = await this.getOrCreateMCPServer(toolkit);
      
      // TODO: Update this when the correct MCP API is available
      // return await this.composio.mcp.getServer(serverId, userId);
      return { id: serverId, status: 'active', url: `mcp://${toolkit}` };
    } catch (error) {
      console.error(`Failed to get server URLs for ${toolkit}:`, error);
      throw error;
    }
  }

  /**
   * Check user connection status
   */
  async getUserConnectionStatus(userId: string, toolkit: string): Promise<any> {
    try {
      const serverId = await this.getOrCreateMCPServer(toolkit);
      
      // TODO: Update this when the correct MCP API is available
      // return await this.composio.mcp.getUserConnectionStatus(userId, serverId);
      return { connected: true, serverId, userId };
    } catch (error) {
      console.error(`Failed to get connection status for ${toolkit}:`, error);
      return { connected: false, connectedToolkits: {} };
    }
  }

  /**
   * Initiate authentication for a user using the correct SDK method (always use auth_config_id)
   */
  async initiateAuth(userId: string, toolkit: string): Promise<any> {
    try {
      // The callbackUrl is where users go AFTER authentication is complete
      // NOT where the OAuth provider redirects during OAuth flow
      const postAuthCallbackUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/callback`;
      console.log(`🔧 Initiating OAuth for user ${userId} with toolkit ${toolkit}...`);
      console.log(`🔧 Post-auth callback URL: ${postAuthCallbackUrl}`);

      // Always create/get auth config first, then use its ID (correct approach per docs)
      const authConfig = await this.createAuthConfig(toolkit);
      console.log(`📋 Using auth config ID: ${authConfig.id} for toolkit: ${toolkit}`);
      
      const connectionRequest = await this.composio.connectedAccounts.link(
        userId,
        authConfig.id, // Always use auth_config_id
        {
          callbackUrl: postAuthCallbackUrl, // Where to go after auth completes
        }
      );

      console.log(`✅ OAuth initiated with auth config for ${toolkit}:`, connectionRequest);
      return connectionRequest;
    } catch (error) {
      console.error(`❌ Failed to initiate auth for ${toolkit}:`, error);
      throw error;
    }
  }



  /**
   * Fallback API key field names when API call fails
   */
  private getFallbackApiKeyField(toolkit: string): string[] {
    const apiKeyFieldMap: Record<string, string[]> = {
      'firecrawl': ['api_key'], // Updated based on Composio documentation
      'serpapi': ['api_key'],
      'perplexityai': ['api_key'],
      'openai': ['api_key'],
      'anthropic': ['api_key'],
    };

    return apiKeyFieldMap[toolkit.toLowerCase()] || ['api_key'];
  }

  /**
   * Test an API key for a specific toolkit
   */
  async testApiKey(toolkit: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🧪 Testing API key for ${toolkit}...`);

      // Use known field mappings
      const requiredFields = this.getFallbackApiKeyField(toolkit);
      console.log(`📋 Using known fields for ${toolkit}:`, requiredFields);

      // Create auth config with empty credentials (as per documentation)
      const authConfig = await this.composio.authConfigs.create(toolkit.toUpperCase(), {
        name: `${toolkit} API Key Test`,
        type: 'use_custom_auth',
        authScheme: 'API_KEY',
        credentials: {}
      });

      console.log(`✅ Test auth config created: ${authConfig.id}`);

      // Build the API key object for connection initiation
      const apiKeyObject: any = {};
      requiredFields.forEach(field => {
        apiKeyObject[field] = apiKey;
      });

      console.log(`🔑 Testing connection with API key fields:`, Object.keys(apiKeyObject));

      // Try connection initiation with API key (as per documentation)
      const testUserId = `test_${Date.now()}`;
      await this.composio.connectedAccounts.initiate(
        testUserId,
        authConfig.id,
        {
          config: {
            authScheme: 'API_KEY' as any,
            val: apiKeyObject
          }
        }
      );

      console.log(`✅ API key test successful for ${toolkit}`);

      // Clean up test auth config
      try {
        await this.composio.authConfigs.delete(authConfig.id);
      } catch (cleanupError) {
        console.warn('Failed to cleanup test auth config:', cleanupError);
      }

      return { success: true };
    } catch (error: any) {
      console.error(`❌ API key test failed for ${toolkit}:`, error);

      // Clean up test auth config on error
      // Note: We don't have the authConfig.id here if creation failed

      return {
        success: false,
        error: error.message || 'Invalid API key'
      };
    }
  }

  /**
   * Connect with an API key for a specific toolkit
   */
  async connectWithApiKey(
    userId: string,
    toolkit: string,
    apiKey: string
  ): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      console.log(`🔗 Connecting with API key for ${toolkit}, user: ${userId}...`);

      // Use known field mappings
      const requiredFields = this.getFallbackApiKeyField(toolkit);
      console.log(`📋 Using known fields for ${toolkit}:`, requiredFields);

      // Create auth config with empty credentials (as per documentation)
      const authConfig = await this.composio.authConfigs.create(toolkit.toUpperCase(), {
        name: `${toolkit} API Key Auth`,
        type: 'use_custom_auth',
        authScheme: 'API_KEY',
        credentials: {}
      });

      console.log(`✅ Auth config created: ${authConfig.id}`);

      // Build the API key object for connection initiation
      const apiKeyObject: any = {};
      requiredFields.forEach(field => {
        apiKeyObject[field] = apiKey;
      });

      console.log(`🔑 Creating connection with API key fields:`, Object.keys(apiKeyObject));

      // Create connection with API key (as per documentation)
      const connectionRequest = await this.composio.connectedAccounts.initiate(
        userId,
        authConfig.id,
        {
          config: {
            authScheme: 'API_KEY' as any,
            val: apiKeyObject
          }
        }
      );

      console.log(`✅ API key connection successful for ${toolkit}:`, connectionRequest.id);

      return {
        success: true,
        connectionId: connectionRequest.id
      };
    } catch (error: any) {
      console.error(`❌ API key connection failed for ${toolkit}:`, error);

      return {
        success: false,
        error: error.message || 'Failed to connect with API key'
      };
    }
  }

  /**
   * Get connection parameters for a toolkit
   */
  async getConnectionParams(toolkit: string): Promise<any> {
    try {
      const serverId = await this.getOrCreateMCPServer(toolkit);

      // TODO: Fix this method when the correct API is available
      console.log(`Getting connection params for ${toolkit} with server ${serverId}`);
      return { serverId, toolkit };
    } catch (error) {
      console.error(`Failed to get connection params for ${toolkit}:`, error);
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
let mcpClient: ComposioMCPClient | null = null;

export function getComposioMCPClient(): ComposioMCPClient {
  if (!mcpClient) {
    mcpClient = new ComposioMCPClient();
  }
  return mcpClient;
}

/**
 * Initialize OAuth connection using the correct Composio SDK approach
 */
export async function initiateMCPConnection(
  userId: string,
  workspaceId: string,
  toolkit: string,
  source: string = 'workspace'
): Promise<{ redirectUrl: string; state: string }> {
  const client = getComposioMCPClient();

  try {
    console.log(`🚀 Starting OAuth flow for user ${userId}, workspace ${workspaceId}, toolkit ${toolkit}`);

    const result = await client.initiateAuth(userId, toolkit);

    if (result && result.redirectUrl) {
      console.log(`✅ OAuth redirect URL generated for ${toolkit}: ${result.redirectUrl}`);

      // For hosted authentication, Composio manages the state internally
      // We include our metadata in the callback URL as query parameters
      return {
        redirectUrl: result.redirectUrl,
        state: result.state || '', // Use Composio's state if provided
        metadata: {
          userId,
          workspaceId,
          toolkit,
          source
        }
      };
    } else {
      console.error('❌ No redirect URL returned from auth initiation:', result);
      throw new Error('No redirect URL returned from OAuth initiation');
    }
  } catch (error) {
    console.error('❌ Failed to initiate OAuth connection:', error);
    throw new Error(`Failed to initiate OAuth connection for ${toolkit}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if user has connection for toolkit
 */
export async function checkMCPConnectionStatus(
  userId: string,
  toolkit: string
): Promise<{ isConnected: boolean; status: string }> {
  const client = getComposioMCPClient();
  
  try {
    const status = await client.getUserConnectionStatus(userId, toolkit);
    return {
      isConnected: status.connected || false,
      status: status.connected ? 'connected' : 'disconnected'
    };
  } catch (error) {
    console.error('Failed to check MCP connection status:', error);
    return { isConnected: false, status: 'error' };
  }
}

/**
 * Generate secure state parameter for OAuth flow
 */
function generateSecureState(userId: string, workspaceId: string, toolkit: string, source: string = 'workspace'): string {
  const data = {
    userId,
    workspaceId,
    toolkit,
    source, // 'marketplace' or 'workspace'
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(2),
  };

  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

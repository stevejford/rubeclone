const { Composio } = require('@composio/core');

async function testComposio() {
  try {
    console.log('Testing Composio SDK...');
    
    const composio = new Composio({
      apiKey: 'ak_H96RZGovXh0PoqqSLcHa',
    });

    console.log('Composio client created');

    // Test 1: List connected accounts
    console.log('\nTesting connected accounts...');
    try {
      const accounts = await composio.connectedAccounts.list();
      console.log('Connected accounts:', accounts.length || 0);
      if (accounts && accounts.length > 0) {
        console.log('First account:', accounts[0]);
      }
    } catch (error) {
      console.log('Connected accounts error:', error.message);
    }

    // Test 2: Get tools for gmail
    console.log('\nTesting tools for Gmail...');
    try {
      const tools = await composio.tools.get('default', { toolkits: ['gmail'] });
      console.log('Gmail tools found:', tools.length);
      if (tools.length > 0) {
        console.log('First tool:', tools[0].function.name);
      }
    } catch (error) {
      console.log('Gmail tools error:', error.message);
    }

    // Test 3: Create auth config for Gmail
    console.log('\nTesting auth config creation for Gmail...');
    let authConfigId = null;
    try {
      // Check if we have any existing auth configs
      const existingConfigs = await composio.authConfigs.list();
      console.log('Existing auth configs:', existingConfigs.length);

      // Look for Gmail auth config
      const gmailConfig = existingConfigs.find(config => config.app === 'gmail');
      if (gmailConfig) {
        console.log('Found existing Gmail auth config:', gmailConfig.id);
        authConfigId = gmailConfig.id;
      } else {
        console.log('Creating new Gmail auth config...');
        const authConfig = await composio.authConfigs.create({
          app: 'gmail',
          authMode: 'OAUTH2',
          config: {}
        });
        console.log('Auth config created:', authConfig.id);
        authConfigId = authConfig.id;
      }
    } catch (error) {
      console.log('Auth config error:', error.message);
    }

    // Test 4: Create connected account for Gmail
    if (authConfigId) {
      console.log('\nTesting connected account creation for Gmail...');
      try {
        const connectionRequest = await composio.connectedAccounts.initiate(
          'test-user-123', // userId
          authConfigId, // auth config ID
          {
            callbackUrl: 'http://localhost:3000/api/composio/callback',
          }
        );
        
        console.log('Connection request created:', connectionRequest);
        console.log('Redirect URL:', connectionRequest.redirectUrl);
        
      } catch (error) {
        console.log('Connection creation error:', error.message);
        console.log('Error details:', error);
      }
    } else {
      console.log('Skipping connection test - no auth config available');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testComposio();

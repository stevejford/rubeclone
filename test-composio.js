const { Composio } = require('@composio/core');

async function testComposio() {
  try {
    console.log('🔧 Testing Composio SDK...');

    const composio = new Composio({
      apiKey: 'ak_H96RZGovXh0PoqqSLcHa',
    });

    console.log('✅ Composio client created');

    // Test 1: List connected accounts
    console.log('\n📋 Testing connected accounts...');
    try {
      const accounts = await composio.connectedAccounts.list();
      console.log('✅ Connected accounts:', accounts.length || 0);
      if (accounts && accounts.length > 0) {
        console.log('� First account:', accounts[0]);
      }
    } catch (error) {
      console.log('❌ Connected accounts error:', error.message);
    }

    // Test 2: Get tools for gmail
    console.log('\n� Testing tools for Gmail...');
    try {
      const tools = await composio.tools.get('default', { toolkits: ['gmail'] });
      console.log('✅ Gmail tools found:', tools.length);
      if (tools.length > 0) {
        console.log('� First tool:', tools[0].function.name);
      }
    } catch (error) {
      console.log('❌ Gmail tools error:', error.message);
    }

    // Test 3: Create connected account for Gmail
    console.log('\n� Testing connected account creation for Gmail...');
    try {
      // First, we need to create an auth config
      console.log('Creating auth config...');

      // This should create a connection request
      const connectionRequest = await composio.connectedAccounts.initiate(
        'test-user-123', // userId
        'gmail', // app name
        {
          callbackUrl: 'http://localhost:3000/api/composio/callback',
        }
      );

      console.log('✅ Connection request created:', connectionRequest);
      console.log('🔗 Redirect URL:', connectionRequest.redirectUrl);

    } catch (error) {
      console.log('❌ Connection creation error:', error.message);
      console.log('📝 Error details:', error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testComposio();

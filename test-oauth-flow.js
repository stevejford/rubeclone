const { Composio } = require('@composio/core');

async function testOAuthFlow() {
  try {
    console.log('🔧 Testing OAuth flow with Composio SDK...');
    
    const composio = new Composio({
      apiKey: 'ak_H96RZGovXh0PoqqSLcHa',
    });

    console.log('✅ Composio client created');

    // Step 1: Create auth config for Gmail using the correct API from documentation
    console.log('\n🔑 Step 1: Creating auth config for Gmail...');
    let authConfigId = null;
    try {
      console.log('🆕 Creating Gmail auth config using Composio managed auth...');

      // Use the correct API structure from the documentation
      const authConfig = await composio.authConfigs.create('GMAIL', {
        name: 'Gmail Auth Config',
        type: 'use_composio_managed_auth',
      });

      console.log('✅ Auth config created:', authConfig.id);
      authConfigId = authConfig.id;

    } catch (error) {
      console.log('❌ Auth config error:', error.message);
      console.log('📝 Full error:', error);
      return;
    }

    // Step 2: Initiate OAuth connection
    if (authConfigId) {
      console.log('\n🔗 Step 2: Initiating OAuth connection...');
      try {
        const connectionRequest = await composio.connectedAccounts.initiate(
          'test-user-123', // userId
          authConfigId, // auth config ID
          {
            callbackUrl: 'http://localhost:3000/api/composio/callback',
          }
        );
        
        console.log('✅ OAuth connection initiated!');
        console.log('🔗 Redirect URL:', connectionRequest.redirectUrl);
        console.log('📝 Connection ID:', connectionRequest.id);
        console.log('📊 Status:', connectionRequest.status);
        
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Open this URL in your browser:', connectionRequest.redirectUrl);
        console.log('2. Complete the OAuth flow');
        console.log('3. You will be redirected back to the callback URL');
        console.log('4. The connection will be established');
        
      } catch (error) {
        console.log('❌ OAuth initiation error:', error.message);
        console.log('📝 Full error:', error);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testOAuthFlow();

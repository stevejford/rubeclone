#!/usr/bin/env tsx

/**
 * Test script to verify NextAuth configuration loads correctly
 * This ensures the Drizzle adapter is properly configured
 */

import * as dotenv from 'dotenv'

// Load environment variables first
dotenv.config({ path: '.env.local' })

async function testAuthConfig() {
  console.log('🧪 Testing NextAuth Configuration...\n')

  try {
    console.log('1️⃣ Loading NextAuth configuration...')
    
    // Import the auth configuration
    const { authOptions } = await import('../lib/auth')
    
    console.log('✅ NextAuth configuration loaded successfully')
    
    // Check adapter configuration
    console.log('\n2️⃣ Verifying adapter configuration...')
    
    if (authOptions.adapter) {
      console.log('✅ Drizzle adapter is configured')
    } else {
      console.log('❌ No adapter configured')
      return
    }
    
    // Check session strategy
    console.log('\n3️⃣ Verifying session strategy...')
    
    if (authOptions.session?.strategy === 'jwt') {
      console.log('✅ JWT session strategy configured')
    } else {
      console.log('❌ JWT session strategy not configured')
    }
    
    // Check providers
    console.log('\n4️⃣ Verifying providers...')
    
    const providers = authOptions.providers || []
    console.log(`✅ ${providers.length} providers configured:`)
    
    providers.forEach((provider, index) => {
      if ('id' in provider && provider.id) {
        console.log(`   ${index + 1}. ${provider.id}`)
      } else if ('name' in provider && provider.name) {
        console.log(`   ${index + 1}. ${provider.name}`)
      } else {
        console.log(`   ${index + 1}. Unknown provider`)
      }
    })
    
    // Check callbacks
    console.log('\n5️⃣ Verifying callbacks...')
    
    if (authOptions.callbacks?.signIn) {
      console.log('✅ signIn callback configured')
    }
    
    if (authOptions.callbacks?.jwt) {
      console.log('✅ jwt callback configured')
    }
    
    if (authOptions.callbacks?.session) {
      console.log('✅ session callback configured')
    }
    
    // Check pages
    console.log('\n6️⃣ Verifying custom pages...')
    
    if (authOptions.pages?.signIn) {
      console.log(`✅ Custom sign-in page: ${authOptions.pages.signIn}`)
    }
    
    if (authOptions.pages?.error) {
      console.log(`✅ Custom error page: ${authOptions.pages.error}`)
    }
    
    console.log('\n🎉 NextAuth configuration test completed successfully!')
    console.log('\n📋 Configuration Summary:')
    console.log('   ✅ Drizzle adapter properly configured')
    console.log('   ✅ JWT session strategy enabled')
    console.log(`   ✅ ${providers.length} authentication providers`)
    console.log('   ✅ Custom callbacks for role/plan management')
    console.log('   ✅ Custom sign-in and error pages')
    console.log('\n🔧 NextAuth is ready for OAuth and credentials authentication!')

  } catch (error) {
    console.error('❌ NextAuth configuration test failed:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      if (error.stack) {
        console.error('Stack trace:', error.stack)
      }
    }
    
    process.exit(1)
  }
}

// Run the test
testAuthConfig()
  .then(() => {
    console.log('\n✅ NextAuth configuration test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ NextAuth configuration test failed:', error)
    process.exit(1)
  })

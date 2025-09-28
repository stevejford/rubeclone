#!/usr/bin/env tsx

/**
 * Test Redis connection and basic operations
 * 
 * Usage:
 *   npm run test:redis
 *   or
 *   tsx scripts/test-redis.ts
 */

import { createClient } from 'redis'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testRedisConnection() {
  console.log('🔄 Testing Redis connection...')
  
  // Create Redis client
  const client = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD!,
    socket: {
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT || '6379')
    }
  })

  client.on('error', err => console.log('❌ Redis Client Error:', err))
  client.on('connect', () => console.log('✅ Connected to Redis'))
  client.on('disconnect', () => console.log('🔌 Disconnected from Redis'))

  try {
    // Connect to Redis
    await client.connect()
    console.log('✅ Redis connection successful!')

    // Test basic operations
    console.log('\n🧪 Testing basic operations...')
    
    // Set a test value
    await client.set('test:connection', 'Hello from Composio!')
    console.log('✅ SET operation successful')
    
    // Get the test value
    const result = await client.get('test:connection')
    console.log('✅ GET operation successful:', result)
    
    // Test expiration
    await client.setEx('test:expiry', 5, 'This will expire in 5 seconds')
    console.log('✅ SETEX operation successful')
    
    // Test JSON operations (if available)
    try {
      const testData = { name: 'Composio', version: '1.0.0', timestamp: Date.now() }
      await client.set('test:json', JSON.stringify(testData))
      const jsonResult = await client.get('test:json')
      const parsedResult = JSON.parse(jsonResult!)
      console.log('✅ JSON operations successful:', parsedResult)
    } catch (error) {
      console.log('⚠️  JSON operations failed:', error)
    }
    
    // Test cache operations similar to marketplace cache
    console.log('\n🏪 Testing marketplace-like cache operations...')
    
    const mockAppData = {
      apps: [
        { id: 'github', name: 'GitHub', category: 'Development' },
        { id: 'slack', name: 'Slack', category: 'Communication' }
      ],
      total: 2,
      page: 1
    }
    
    // Cache marketplace data
    await client.setEx('marketplace:apps:test', 300, JSON.stringify(mockAppData))
    console.log('✅ Marketplace cache SET successful')
    
    // Retrieve marketplace data
    const cachedData = await client.get('marketplace:apps:test')
    const parsedData = JSON.parse(cachedData!)
    console.log('✅ Marketplace cache GET successful:', parsedData)
    
    // Test cache invalidation
    const keys = await client.keys('test:*')
    if (keys.length > 0) {
      await client.del(keys)
      console.log('✅ Cache invalidation successful, deleted keys:', keys)
    }
    
    console.log('\n🎉 All Redis tests passed!')
    
  } catch (error) {
    console.error('❌ Redis test failed:', error)
    process.exit(1)
  } finally {
    // Clean up
    try {
      await client.quit()
      console.log('🔌 Redis connection closed')
    } catch (error) {
      console.error('⚠️  Error closing Redis connection:', error)
    }
  }
}

// Run the test
if (require.main === module) {
  testRedisConnection()
    .then(() => {
      console.log('\n✅ Redis test completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Redis test failed:', error)
      process.exit(1)
    })
}

export { testRedisConnection }

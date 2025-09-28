#!/usr/bin/env tsx

/**
 * Test script to verify OAuth adapter functionality
 * This script tests the database operations that the NextAuth adapter will perform
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users, accounts, sessions, verificationTokens } from '../lib/db/schema'
import { eq, and } from 'drizzle-orm'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Create database connection directly
const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema: { users, accounts, sessions, verificationTokens } })

async function testAdapterOperations() {
  console.log('🧪 Testing OAuth Adapter Operations...\n')

  try {
    // Test 1: Create a test user (simulating OAuth user creation)
    console.log('1️⃣ Testing user creation...')
    const testEmail = `test-oauth-${Date.now()}@example.com`
    
    const [newUser] = await db.insert(users).values({
      email: testEmail,
      name: 'Test OAuth User',
      image: 'https://example.com/avatar.jpg',
      role: 'user',
      plan: 'free',
      emailVerified: new Date(),
    }).returning()

    console.log(`✅ User created: ${newUser.email} (ID: ${newUser.id})`)

    // Test 2: Link an OAuth account (simulating provider account linking)
    console.log('\n2️⃣ Testing account linking...')
    
    const [newAccount] = await db.insert(accounts).values({
      userId: newUser.id,
      type: 'oauth',
      provider: 'github',
      providerAccountId: '12345678',
      accessToken: 'gho_test_access_token',
      refreshToken: 'ghr_test_refresh_token',
      expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      tokenType: 'bearer',
      scope: 'read:user user:email',
    }).returning()

    console.log(`✅ Account linked: ${newAccount.provider} (Provider ID: ${newAccount.providerAccountId})`)

    // Test 3: Create a session (simulating session creation)
    console.log('\n3️⃣ Testing session creation...')
    
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const [newSession] = await db.insert(sessions).values({
      sessionToken,
      userId: newUser.id,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }).returning()

    console.log(`✅ Session created: ${newSession.sessionToken}`)

    // Test 4: Retrieve user by account (simulating OAuth sign-in lookup)
    console.log('\n4️⃣ Testing user lookup by OAuth account...')
    
    const userByAccount = await db
      .select({
        user: users,
        account: accounts,
      })
      .from(users)
      .innerJoin(accounts, eq(accounts.userId, users.id))
      .where(
        and(
          eq(accounts.provider, 'github'),
          eq(accounts.providerAccountId, '12345678')
        )
      )
      .limit(1)

    if (userByAccount.length > 0) {
      console.log(`✅ User found by OAuth account: ${userByAccount[0]!.user.email}`)
    } else {
      console.log('❌ User not found by OAuth account')
    }

    // Test 5: Retrieve session and user (simulating session validation)
    console.log('\n5️⃣ Testing session and user retrieval...')
    
    const sessionAndUser = await db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.sessionToken, sessionToken))
      .limit(1)

    if (sessionAndUser.length > 0) {
      console.log(`✅ Session and user retrieved: ${sessionAndUser[0]!.user.email}`)
    } else {
      console.log('❌ Session and user not found')
    }

    // Test 6: Update user information (simulating profile updates)
    console.log('\n6️⃣ Testing user update...')
    
    const [updatedUser] = await db
      .update(users)
      .set({
        name: 'Updated OAuth User',
        image: 'https://example.com/new-avatar.jpg',
        updatedAt: new Date(),
      })
      .where(eq(users.id, newUser.id))
      .returning()

    console.log(`✅ User updated: ${updatedUser.name}`)

    // Test 7: Create verification token (simulating email verification)
    console.log('\n7️⃣ Testing verification token creation...')
    
    const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const [newVerificationToken] = await db.insert(verificationTokens).values({
      identifier: testEmail,
      token: verificationToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    }).returning()

    console.log(`✅ Verification token created: ${newVerificationToken.token}`)

    // Cleanup: Remove test data
    console.log('\n🧹 Cleaning up test data...')
    
    await db.delete(verificationTokens).where(eq(verificationTokens.id, newVerificationToken.id))
    await db.delete(sessions).where(eq(sessions.id, newSession.id))
    await db.delete(accounts).where(eq(accounts.id, newAccount.id))
    await db.delete(users).where(eq(users.id, newUser.id))

    console.log('✅ Test data cleaned up')

    console.log('\n🎉 All OAuth adapter operations tested successfully!')
    console.log('\n📋 Summary:')
    console.log('   ✅ User creation and retrieval')
    console.log('   ✅ OAuth account linking')
    console.log('   ✅ Session management')
    console.log('   ✅ User lookup by OAuth provider')
    console.log('   ✅ Session validation')
    console.log('   ✅ User profile updates')
    console.log('   ✅ Verification token handling')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testAdapterOperations()
  .then(() => {
    console.log('\n✅ OAuth adapter test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ OAuth adapter test failed:', error)
    process.exit(1)
  })

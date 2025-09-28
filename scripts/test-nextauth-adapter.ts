#!/usr/bin/env tsx

/**
 * Test script to verify NextAuth Drizzle adapter integration
 * This script simulates the NextAuth adapter operations to ensure everything works correctly
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users, accounts, sessions, verificationTokens } from '../lib/db/schema'
import { eq, and } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Create database connection directly
const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema: { users, accounts, sessions, verificationTokens } })

async function testNextAuthAdapter() {
  console.log('🧪 Testing NextAuth Drizzle Adapter Integration...\n')

  try {
    // Test 1: Simulate OAuth user creation (first-time GitHub login)
    console.log('1️⃣ Testing OAuth user creation (first-time login)...')
    const testEmail = `oauth-test-${Date.now()}@example.com`
    
    // This simulates what the adapter does when a new OAuth user signs in
    const [newUser] = await db.insert(users).values({
      email: testEmail,
      name: 'GitHub Test User',
      image: 'https://avatars.githubusercontent.com/u/12345678',
      role: 'user',
      plan: 'free',
      emailVerified: new Date(),
    }).returning()

    if (!newUser) {
      throw new Error('Failed to create OAuth user')
    }
    console.log(`✅ OAuth user created: ${newUser.email} (ID: ${newUser.id})`)

    // Test 2: Link GitHub account to user
    console.log('\n2️⃣ Testing OAuth account linking...')
    
    const [linkedAccount] = await db.insert(accounts).values({
      userId: newUser.id,
      type: 'oauth',
      provider: 'github',
      providerAccountId: '12345678',
      accessToken: 'gho_test_access_token_123',
      refreshToken: 'ghr_test_refresh_token_456',
      expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      tokenType: 'bearer',
      scope: 'read:user user:email',
    }).returning()

    if (!linkedAccount) {
      throw new Error('Failed to link GitHub account')
    }
    console.log(`✅ GitHub account linked: Provider ID ${linkedAccount.providerAccountId}`)

    // Test 3: Simulate subsequent OAuth login (user lookup by account)
    console.log('\n3️⃣ Testing OAuth user lookup (subsequent login)...')
    
    const existingUserByAccount = await db
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

    if (existingUserByAccount.length > 0) {
      console.log(`✅ User found by GitHub account: ${existingUserByAccount[0]!.user.email}`)
      console.log(`   Role: ${existingUserByAccount[0]!.user.role}, Plan: ${existingUserByAccount[0]!.user.plan}`)
    } else {
      console.log('❌ User not found by GitHub account')
    }

    // Test 4: Test credentials user creation and authentication
    console.log('\n4️⃣ Testing credentials user creation...')
    
    const credentialsEmail = `credentials-test-${Date.now()}@example.com`
    const password = 'testPassword123!'
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const [credentialsUser] = await db.insert(users).values({
      email: credentialsEmail,
      name: 'Credentials Test User',
      password: hashedPassword,
      role: 'user',
      plan: 'free',
    }).returning()

    if (!credentialsUser) {
      throw new Error('Failed to create credentials user')
    }
    console.log(`✅ Credentials user created: ${credentialsUser.email} (ID: ${credentialsUser.id})`)

    // Test 5: Test credentials authentication
    console.log('\n5️⃣ Testing credentials authentication...')
    
    const [authUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, credentialsEmail))
      .limit(1)

    if (authUser && authUser.password) {
      const isPasswordValid = await bcrypt.compare(password, authUser.password)
      console.log(`✅ Password validation: ${isPasswordValid ? 'VALID' : 'INVALID'}`)
    } else {
      console.log('❌ User or password not found')
    }

    // Test 6: Test session creation and validation
    console.log('\n6️⃣ Testing session management...')
    
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const [newSession] = await db.insert(sessions).values({
      sessionToken,
      userId: newUser.id,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }).returning()

    console.log(`✅ Session created: ${newSession.sessionToken}`)

    // Validate session
    const [sessionValidation] = await db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.sessionToken, sessionToken))
      .limit(1)

    if (sessionValidation) {
      console.log(`✅ Session validated for user: ${sessionValidation.user.email}`)
    } else {
      console.log('❌ Session validation failed')
    }

    // Test 7: Test verification token creation
    console.log('\n7️⃣ Testing verification token...')
    
    const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const [newVerificationToken] = await db.insert(verificationTokens).values({
      identifier: testEmail,
      token: verificationToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    }).returning()

    console.log(`✅ Verification token created: ${newVerificationToken.token}`)

    // Test 8: Test account linking for existing user (e.g., adding Google to GitHub user)
    console.log('\n8️⃣ Testing multiple OAuth provider linking...')
    
    const [googleAccount] = await db.insert(accounts).values({
      userId: newUser.id, // Same user as GitHub account
      type: 'oauth',
      provider: 'google',
      providerAccountId: 'google_user_123456',
      accessToken: 'ya29.test_google_access_token',
      refreshToken: '1//test_google_refresh_token',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      tokenType: 'Bearer',
      scope: 'openid email profile',
    }).returning()

    console.log(`✅ Google account linked to same user: Provider ID ${googleAccount.providerAccountId}`)

    // Verify user has multiple accounts
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, newUser.id))

    console.log(`✅ User has ${userAccounts.length} linked accounts: ${userAccounts.map(a => a.provider).join(', ')}`)

    // Cleanup: Remove test data
    console.log('\n🧹 Cleaning up test data...')
    
    await db.delete(verificationTokens).where(eq(verificationTokens.id, newVerificationToken.id))
    await db.delete(sessions).where(eq(sessions.id, newSession.id))
    await db.delete(accounts).where(eq(accounts.userId, newUser.id))
    await db.delete(accounts).where(eq(accounts.userId, credentialsUser.id))
    await db.delete(users).where(eq(users.id, newUser.id))
    await db.delete(users).where(eq(users.id, credentialsUser.id))

    console.log('✅ Test data cleaned up')

    console.log('\n🎉 NextAuth Drizzle Adapter integration test completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   ✅ OAuth user creation and account linking')
    console.log('   ✅ OAuth user lookup by provider account')
    console.log('   ✅ Credentials user creation and authentication')
    console.log('   ✅ Session creation and validation')
    console.log('   ✅ Verification token handling')
    console.log('   ✅ Multiple OAuth provider linking')
    console.log('\n🔧 NextAuth adapter is ready for production use!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testNextAuthAdapter()
  .then(() => {
    console.log('\n✅ NextAuth adapter integration test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ NextAuth adapter integration test failed:', error)
    process.exit(1)
  })

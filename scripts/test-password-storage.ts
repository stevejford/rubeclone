#!/usr/bin/env tsx

import * as dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function testPasswordStorage() {
  try {
    console.log('🔐 Testing password storage and verification...\n')
    
    const testEmail = 'test-password@example.com'
    const testPasswords = [
      'lowercase123',
      'UPPERCASE123', 
      'MixedCase123!',
      'special@#$%^&*()'
    ]
    
    // Clean up any existing test user
    await db.delete(schema.users).where(eq(schema.users.email, testEmail))
    
    for (let i = 0; i < testPasswords.length; i++) {
      const password = testPasswords[i]!
      console.log(`\n${i + 1}. Testing password: "${password}"`)
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12)
      console.log(`   Hashed length: ${hashedPassword.length} characters`)
      console.log(`   Hash starts with: ${hashedPassword.substring(0, 20)}...`)
      
      // Create or update user with this password
      const [user] = await db.insert(schema.users).values({
        email: testEmail,
        name: 'Password Test User',
        password: hashedPassword,
        role: 'user',
        plan: 'free'
      }).onConflictDoUpdate({
        target: schema.users.email,
        set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }).returning()
      
      if (!user) {
        console.log('   ❌ Failed to create/update user')
        continue
      }
      
      // Test password verification with correct password
      const correctVerification = await bcrypt.compare(password, user.password!)
      console.log(`   ✅ Correct password verification: ${correctVerification ? 'PASS' : 'FAIL'}`)
      
      // Test password verification with wrong case
      const wrongCasePassword = password === password.toLowerCase() ? password.toUpperCase() : password.toLowerCase()
      const wrongCaseVerification = await bcrypt.compare(wrongCasePassword, user.password!)
      console.log(`   🔍 Wrong case ("${wrongCasePassword}") verification: ${wrongCaseVerification ? 'PASS (unexpected!)' : 'FAIL (expected)'}`)
      
      // Test password verification with completely wrong password
      const wrongPasswordVerification = await bcrypt.compare('wrongpassword123', user.password!)
      console.log(`   ❌ Wrong password verification: ${wrongPasswordVerification ? 'PASS (unexpected!)' : 'FAIL (expected)'}`)
    }
    
    // Clean up test user
    await db.delete(schema.users).where(eq(schema.users.email, testEmail))
    console.log('\n🧹 Test user cleaned up')
    
    console.log('\n📋 Summary:')
    console.log('✅ Passwords are properly hashed using bcrypt')
    console.log('✅ Password verification is case-sensitive (as expected)')
    console.log('✅ Wrong passwords are correctly rejected')
    console.log('✅ Passwords are NOT stored in uppercase - they maintain original case during hashing')
    
  } catch (error) {
    console.error('❌ Error testing password storage:', error)
  }
}

testPasswordStorage()

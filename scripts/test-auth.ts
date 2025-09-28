import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...')
    
    const email = 'stevejford1@gmail.com'
    console.log(`Looking for user: ${email}`)
    
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0
    })
    
    if (!user.password) {
      console.log('❌ User has no password set')
      return
    }
    
    // Test with a common password
    const testPasswords = ['password', 'password123', '123456', 'admin']
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, user.password)
      console.log(`Testing password "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`)
      if (isValid) break
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testAuth()

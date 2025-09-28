import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function debugPassword() {
  try {
    console.log('🔍 Debugging password issue...')
    
    const email = 'stevejford1@gmail.com'
    const testPassword = 'password123'
    
    console.log(`Email: ${email}`)
    console.log(`Test password: ${testPassword}`)
    
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('User details:')
    console.log('  ID:', user.id)
    console.log('  Email:', user.email)
    console.log('  Name:', user.name)
    console.log('  Has password:', !!user.password)
    console.log('  Password length:', user.password?.length)
    console.log('  Password starts with:', user.password?.substring(0, 10))
    
    if (!user.password) {
      console.log('❌ No password set')
      return
    }
    
    // Test the password comparison step by step
    console.log('\n🔐 Testing password comparison...')
    
    try {
      const result = await bcrypt.compare(testPassword, user.password)
      console.log(`bcrypt.compare result: ${result}`)
      
      // Also test with a fresh hash
      console.log('\n🔄 Creating fresh hash for comparison...')
      const freshHash = await bcrypt.hash(testPassword, 12)
      console.log('Fresh hash created:', freshHash.substring(0, 20) + '...')
      
      const freshResult = await bcrypt.compare(testPassword, freshHash)
      console.log(`Fresh hash comparison: ${freshResult}`)
      
    } catch (error) {
      console.error('❌ bcrypt error:', error)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugPassword()

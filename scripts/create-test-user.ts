import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function createTestUser() {
  try {
    console.log('🔍 Checking existing users...')
    
    const existingUsers = await db.select().from(schema.users)
    console.log('Found users:', existingUsers.length)
    
    if (existingUsers.length === 0) {
      console.log('📝 Creating test user...')
      
      const hashedPassword = await bcrypt.hash('password123', 12)
      
      const [newUser] = await db.insert(schema.users).values({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
      }).returning()

      if (newUser) {
        console.log('✅ Test user created:', {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        })
      } else {
        console.log('❌ Failed to create test user')
      }
    } else {
      console.log('👤 Existing users:')
      existingUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.name}) - Role: ${user.role}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createTestUser()

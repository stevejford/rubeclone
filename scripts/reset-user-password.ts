import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function resetPassword() {
  try {
    console.log('🔄 Resetting user password...')
    
    const email = 'stevejford1@gmail.com'
    const newPassword = 'password123'
    
    console.log(`Resetting password for: ${email}`)
    console.log(`New password: ${newPassword}`)
    
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    console.log('Password hashed successfully')
    
    const result = await db
      .update(schema.users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(schema.users.email, email))
      .returning()
    
    if (result.length > 0 && result[0]) {
      console.log('✅ Password updated successfully for user:', result[0].email)
      
      // Test the new password
      const isValid = await bcrypt.compare(newPassword, hashedPassword)
      console.log(`Password verification test: ${isValid ? '✅ PASSED' : '❌ FAILED'}`)
    } else {
      console.log('❌ No user found with that email')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

resetPassword()

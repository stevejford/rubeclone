#!/usr/bin/env tsx

import * as dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'

// Load environment variables
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function checkUsers() {
  try {
    console.log('👥 Checking users in database...\n')
    
    const users = await db.select().from(schema.users)
    
    if (users.length === 0) {
      console.log('❌ No users found in database')
      return
    }
    
    console.log(`✅ Found ${users.length} user(s):`)
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name || 'N/A'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Plan: ${user.plan}`)
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`)
      console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`)
      console.log(`   Created: ${user.createdAt}`)
      console.log(`   Updated: ${user.updatedAt}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking users:', error)
  }
}

checkUsers()

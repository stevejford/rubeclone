import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'

async function testDatabase() {
  try {
    console.log('Testing database connection...')

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }

    // Create direct connection
    const sql = neon(process.env.DATABASE_URL)
    const db = drizzle(sql, { schema })

    // Test basic query
    const result = await db.select().from(schema.users).limit(1)
    console.log('✅ Database connection successful!')
    console.log('Users count:', result.length)

    // Test database info
    const info = await sql`SELECT version() as version`
    console.log('Database version:', info[0]?.version)

  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

testDatabase()

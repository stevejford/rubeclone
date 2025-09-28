#!/usr/bin/env tsx

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { existsSync } from 'fs'
import path from 'path'

async function runMigration() {
  try {
    console.log('🔄 Running database migration...')

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // Check if migrations directory exists
    const migrationsDir = path.join(process.cwd(), 'drizzle')
    if (!existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found. Run "npm run db:generate" first.')
      return
    }

    console.log('🔗 Connecting to database...')
    const sql = neon(process.env.DATABASE_URL)
    const db = drizzle(sql)

    // Test connection
    console.log('🧪 Testing database connection...')
    await sql`SELECT 1`
    console.log('✅ Database connection successful')

    console.log('📦 Applying migrations...')
    await migrate(db as any, { migrationsFolder: './drizzle' })

    console.log('✅ Migration completed successfully!')
    console.log('🎉 Database is now up to date')

  } catch (error) {
    console.error('❌ Migration failed:')
    if (error instanceof Error) {
      console.error(error.message)

      // Provide helpful error messages
      if (error.message.includes('connect')) {
        console.error('💡 Check your DATABASE_URL and network connection')
      } else if (error.message.includes('permission')) {
        console.error('💡 Check database permissions and credentials')
      }
    } else {
      console.error(error)
    }
    process.exit(1)
  }
}

runMigration()

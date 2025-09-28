#!/usr/bin/env tsx

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import readline from 'readline'

async function confirmReset(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('⚠️  This will permanently delete all data. Are you sure? (y/N): ', (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...')

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // Confirm reset in production-like environments
    if (process.env.NODE_ENV === 'production') {
      const confirmed = await confirmReset()
      if (!confirmed) {
        console.log('❌ Reset cancelled')
        return
      }
    }

    const sql = neon(process.env.DATABASE_URL)

    console.log('📋 Listing existing tables...')
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
    console.log('Found tables:', tables.map(t => t.table_name))

    // Drop all tables in correct order (respecting foreign key constraints)
    console.log('🗑️ Dropping all tables...')

    // Drop child tables first
    const tablesToDrop = [
      'tool_usage',
      'workspace_tools',
      'workspace_members',
      'sessions',
      'accounts',
      'verification_tokens',
      'workspaces',
      'tools',
      'users'
    ]

    for (const table of tablesToDrop) {
      console.log(`Dropping table: ${table}`)
      await sql.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`)
    }

    console.log('✅ Database reset complete!')
    console.log('🔧 Run "npm run db:migrate" to recreate tables')
    console.log('🌱 Run "npm run db:seed" to add development data')

  } catch (error) {
    console.error('❌ Database reset failed:')
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
    process.exit(1)
  }
}

resetDatabase()

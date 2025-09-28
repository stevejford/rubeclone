#!/usr/bin/env tsx

import 'dotenv/config'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

async function generateMigration() {
  try {
    console.log('🔄 Generating database migration...')
    
    // Check if drizzle.config.ts exists
    const configPath = path.join(process.cwd(), 'drizzle.config.ts')
    if (!existsSync(configPath)) {
      throw new Error('drizzle.config.ts not found. Please ensure Drizzle is properly configured.')
    }

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // Generate migration
    const command = 'npx drizzle-kit generate'
    console.log(`Running: ${command}`)
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    })
    
    console.log(output)
    console.log('✅ Migration generated successfully!')
    console.log('📁 Check the ./drizzle directory for the new migration file')
    console.log('🚀 Run "npm run db:migrate" to apply the migration')
    
  } catch (error) {
    console.error('❌ Failed to generate migration:')
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
    process.exit(1)
  }
}

// Run the migration generation
generateMigration()

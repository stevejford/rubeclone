#!/usr/bin/env tsx

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface IndexInfo {
  indexname: string
  tablename: string
  indexdef: string
}

async function validateSchema() {
  try {
    console.log('🔍 Validating database schema...')
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Test connection
    console.log('🔗 Testing database connection...')
    await sql`SELECT 1`
    console.log('✅ Database connection successful')

    // Get all tables and their columns
    console.log('📋 Checking table structure...')
    const tableInfo = await sql<TableInfo[]>`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    // Get all indexes
    const indexInfo = await sql<IndexInfo[]>`
      SELECT 
        indexname,
        tablename,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `

    // Expected tables and their key columns
    const expectedTables = {
      users: ['id', 'email', 'name', 'plan'],
      accounts: ['id', 'user_id', 'type', 'provider', 'provider_account_id', 'refresh_token', 'access_token', 'expires_at', 'token_type', 'scope', 'id_token', 'session_state', 'created_at', 'updated_at'],
      sessions: ['id', 'session_token', 'user_id', 'expires', 'created_at', 'updated_at'],
      verification_tokens: ['id', 'identifier', 'token', 'expires', 'created_at'],
      workspaces: ['id', 'name', 'type', 'owner_id'],
      workspace_members: ['id', 'workspace_id', 'user_id', 'role'],
      workspace_tools: ['id', 'workspace_id', 'tool_slug', 'enabled_by'],
      tool_usage: ['id', 'user_id', 'workspace_id', 'tool_slug', 'usage_date']
    }

    // Group table info by table name
    const tablesByName = tableInfo.reduce((acc, row) => {
      if (!acc[row.table_name]) {
        acc[row.table_name] = []
      }
      acc[row.table_name].push(row)
      return acc
    }, {} as Record<string, TableInfo[]>)

    let hasErrors = false

    // Check each expected table
    for (const [tableName, expectedColumns] of Object.entries(expectedTables)) {
      console.log(`\n🔍 Validating table: ${tableName}`)
      
      if (!tablesByName[tableName]) {
        console.error(`❌ Table '${tableName}' is missing`)
        hasErrors = true
        continue
      }

      const columns = tablesByName[tableName]
      const columnNames = columns.map(c => c.column_name)

      // Check for missing columns
      for (const expectedColumn of expectedColumns) {
        if (!columnNames.includes(expectedColumn)) {
          console.error(`❌ Column '${expectedColumn}' is missing from table '${tableName}'`)
          hasErrors = true
        } else {
          console.log(`✅ Column '${expectedColumn}' exists`)
        }
      }

      // Show all columns for reference
      console.log(`   Columns: ${columnNames.join(', ')}`)
    }

    // Check indexes
    console.log('\n🔍 Validating indexes...')
    const indexesByTable = indexInfo.reduce((acc, row) => {
      if (!acc[row.tablename]) {
        acc[row.tablename] = []
      }
      acc[row.tablename].push(row)
      return acc
    }, {} as Record<string, IndexInfo[]>)

    // Expected indexes (key ones for performance)
    const expectedIndexes = {
      workspaces: ['workspaces_owner_idx', 'workspaces_type_idx'],
      workspace_members: ['workspace_members_workspace_idx', 'workspace_members_user_idx'],
      workspace_tools: ['workspace_tools_workspace_idx', 'workspace_tools_slug_idx'],
      tool_usage: ['tool_usage_user_idx', 'tool_usage_workspace_idx', 'tool_usage_date_idx']
    }

    for (const [tableName, expectedIndexNames] of Object.entries(expectedIndexes)) {
      const tableIndexes = indexesByTable[tableName] || []
      const indexNames = tableIndexes.map(i => i.indexname)

      for (const expectedIndex of expectedIndexNames) {
        if (indexNames.includes(expectedIndex)) {
          console.log(`✅ Index '${expectedIndex}' exists on table '${tableName}'`)
        } else {
          console.warn(`⚠️  Index '${expectedIndex}' is missing from table '${tableName}'`)
        }
      }
    }

    // Check for critical unique constraints
    console.log('\n🔍 Validating unique constraints...')

    // Check accounts_provider_account_unique
    const accountsIndexes = indexesByTable['accounts'] || []
    const hasAccountsUnique = accountsIndexes.some(idx =>
      idx.indexname === 'accounts_provider_account_unique' &&
      idx.indexdef.includes('UNIQUE')
    )
    if (hasAccountsUnique) {
      console.log('✅ Unique constraint accounts_provider_account_unique exists')
    } else {
      console.warn('⚠️  Unique constraint accounts_provider_account_unique is missing')
    }

    // Check sessions session_token unique
    const sessionsIndexes = indexesByTable['sessions'] || []
    const hasSessionTokenUnique = sessionsIndexes.some(idx =>
      idx.indexdef.includes('UNIQUE') &&
      idx.indexdef.includes('session_token')
    )
    if (hasSessionTokenUnique) {
      console.log('✅ Unique constraint on sessions(session_token) exists')
    } else {
      console.warn('⚠️  Unique constraint on sessions(session_token) is missing')
    }

    // Check foreign key constraints
    console.log('\n🔍 Checking foreign key constraints...')
    const constraints = await sql`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `

    console.log(`Found ${constraints.length} foreign key constraints`)
    for (const constraint of constraints) {
      console.log(`✅ ${constraint.table_name}.${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`)
    }

    if (hasErrors) {
      console.log('\n❌ Schema validation failed with errors')
      console.log('💡 Run "npm run db:generate" and "npm run db:migrate" to fix schema issues')
      process.exit(1)
    } else {
      console.log('\n✅ Schema validation passed!')
      console.log('🎉 Database schema is properly configured')
    }

  } catch (error) {
    console.error('❌ Schema validation failed:')
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
    process.exit(1)
  }
}

validateSchema()

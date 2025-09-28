#!/usr/bin/env tsx

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import {
  users,
  workspaces,
  workspaceMembers,
  workspaceTools,
  toolUsage
} from '../lib/db/schema'
import { seedData } from '../lib/db/seed-data'

// Create database connection directly without env validation
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql, {
  schema: { users, workspaces, workspaceMembers, workspaceTools, toolUsage }
})

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with development data...')

    // Clear existing seed data (in reverse order to respect foreign keys)
    console.log('🧹 Clearing existing seed data...')
    await db.delete(toolUsage)
    await db.delete(workspaceTools)
    await db.delete(workspaceMembers)
    await db.delete(workspaces)
    await db.delete(users)

    console.log('👥 Inserting users...')
    const insertedUsers = await db.insert(users).values(seedData.users).returning()
    console.log(`✅ Inserted ${insertedUsers.length} users`)

    // Build email → id map for users
    const emailToUserId = new Map<string, number>()
    for (const user of insertedUsers) {
      emailToUserId.set(user.email, user.id)
    }

    console.log('🏢 Inserting workspaces...')
    // Map workspace data to include owner_id from email
    const workspaceInsertData = seedData.workspaces.map(ws => ({
      name: ws.name,
      type: ws.type,
      owner_id: emailToUserId.get(ws.owner_email)!,
      description: ws.description,
      settings: ws.settings,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt
    }))
    const insertedWorkspaces = await db.insert(workspaces).values(workspaceInsertData).returning()
    console.log(`✅ Inserted ${insertedWorkspaces.length} workspaces`)

    // Build name → id map for workspaces
    const nameToWorkspaceId = new Map<string, number>()
    for (const workspace of insertedWorkspaces) {
      nameToWorkspaceId.set(workspace.name, workspace.id)
    }

    console.log('👨‍💼 Inserting workspace members...')
    // Map workspace members data to include workspace_id and user_id from names/emails
    const memberInsertData = seedData.workspaceMembers.map(member => ({
      workspace_id: nameToWorkspaceId.get(member.workspace_name)!,
      user_id: emailToUserId.get(member.user_email)!,
      role: member.role,
      joined_at: member.joined_at
    }))
    const insertedMembers = await db.insert(workspaceMembers).values(memberInsertData).returning()
    console.log(`✅ Inserted ${insertedMembers.length} workspace members`)

    console.log('🔧 Inserting workspace tools...')
    // Map workspace tools data to include workspace_id and enabled_by from names/emails
    const toolInsertData = seedData.workspaceTools.map(tool => ({
      workspace_id: nameToWorkspaceId.get(tool.workspace_name)!,
      tool_slug: tool.tool_slug,
      enabled_by: emailToUserId.get(tool.enabled_by_email)!,
      enabled_at: tool.enabled_at,
      is_enabled: tool.is_enabled,
      config: tool.config
    }))
    const insertedTools = await db.insert(workspaceTools).values(toolInsertData).returning()
    console.log(`✅ Inserted ${insertedTools.length} workspace tools`)

    console.log('📊 Inserting tool usage data...')
    // Map tool usage data to include user_id and workspace_id from emails/names
    const usageInsertData = seedData.toolUsage.map(usage => ({
      user_id: emailToUserId.get(usage.user_email)!,
      workspace_id: nameToWorkspaceId.get(usage.workspace_name)!,
      tool_slug: usage.tool_slug,
      usage_date: usage.usage_date,
      api_calls: usage.api_calls,
      created_at: usage.created_at,
      updated_at: usage.updated_at
    }))
    const insertedUsage = await db.insert(toolUsage).values(usageInsertData).returning()
    console.log(`✅ Inserted ${insertedUsage.length} tool usage records`)

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   Users: ${insertedUsers.length}`)
    console.log(`   Workspaces: ${insertedWorkspaces.length}`)
    console.log(`   Workspace Members: ${insertedMembers.length}`)
    console.log(`   Workspace Tools: ${insertedTools.length}`)
    console.log(`   Tool Usage Records: ${insertedUsage.length}`)

  } catch (error) {
    console.error('❌ Database seeding failed:')
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
    process.exit(1)
  }
}

seedDatabase()

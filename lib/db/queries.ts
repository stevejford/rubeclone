import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { 
  users, 
  workspaces, 
  workspaceMembers, 
  workspaceTools, 
  toolUsage,
  type User,
  type NewUser,
  type Workspace,
  type NewWorkspace,
  type WorkspaceMember,
  type NewWorkspaceMember,
  type WorkspaceTool,

  type ToolUsage,
  type NewToolUsage
} from './schema'

// User queries
export async function createUser(userData: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(userData).returning()
  if (!user) {
    throw new Error('Failed to create user')
  }
  return user
}

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user || null
}

// Convert string IDs to numbers for database operations
function parseId(id: string | number): number {
  if (typeof id === 'number') {
    if (isNaN(id) || !isFinite(id)) {
      throw new Error(`Invalid numeric ID: ${id}`)
    }
    return id
  }
  
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10)
    if (isNaN(parsed) || !isFinite(parsed)) {
      throw new Error(`Invalid string ID: ${id}`)
    }
    return parsed
  }
  
  throw new Error(`Invalid ID type: ${typeof id}`)
}

export async function updateUser(id: number, userData: Partial<NewUser>): Promise<User> {
  const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning()
  if (!user) {
    throw new Error('Failed to update user')
  }
  return user
}

// Workspace queries
export async function createWorkspace(workspaceData: NewWorkspace | any): Promise<Workspace> {
  // Handle both database format and API format
  const dbData = {
    name: workspaceData.name,
    type: workspaceData.type,
    owner_id: workspaceData.owner_id || workspaceData.ownerId,
    description: workspaceData.description,
    settings: workspaceData.settings || {}
  }

  const [workspace] = await db.insert(workspaces).values(dbData).returning()
  if (!workspace) {
    throw new Error('Failed to create workspace')
  }
  return workspace
}

export async function getWorkspaceById(id: number | string, _userId?: number | string): Promise<Workspace | null> {
  const workspaceId = parseId(id)
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  return workspace || null
}

export async function getUserWorkspaces(userId: number | string): Promise<Workspace[]> {
  const userIdNum = parseId(userId)

  // Get workspaces where user is owner
  const ownedWorkspaces = await db.select().from(workspaces).where(eq(workspaces.owner_id, userIdNum))

  // Get workspaces where user is a member
  const memberWorkspaces = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      type: workspaces.type,
      owner_id: workspaces.owner_id,
      description: workspaces.description,
      settings: workspaces.settings,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspace_id))
    .where(eq(workspaceMembers.user_id, userIdNum))

  // Combine and deduplicate (in case user is both owner and member)
  const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces]
  const uniqueWorkspaces = allWorkspaces.filter((workspace, index, self) =>
    index === self.findIndex(w => w.id === workspace.id)
  )

  return uniqueWorkspaces
}

export async function updateWorkspace(id: number | string, workspaceData: Partial<NewWorkspace>): Promise<Workspace> {
  const workspaceId = parseId(id)
  const [workspace] = await db.update(workspaces).set(workspaceData).where(eq(workspaces.id, workspaceId)).returning()
  if (!workspace) {
    throw new Error('Failed to update workspace')
  }
  return workspace
}

export async function deleteWorkspace(id: number | string): Promise<void> {
  const workspaceId = parseId(id)
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId))
}

// Workspace member queries
export async function addWorkspaceMember(memberData: NewWorkspaceMember | any): Promise<WorkspaceMember> {
  // Handle both database format and API format
  const dbData = {
    workspace_id: parseId(memberData.workspace_id || memberData.workspaceId),
    user_id: parseId(memberData.user_id || memberData.userId),
    role: memberData.role || 'member'
  }

  const [member] = await db.insert(workspaceMembers).values(dbData).returning()
  if (!member) {
    throw new Error('Failed to add workspace member')
  }
  return member
}

export async function getWorkspaceMembers(workspaceId: number | string, _userId?: number | string): Promise<(WorkspaceMember & { user: User })[]> {
  const workspaceIdNum = parseId(workspaceId)
  return await db
    .select({
      id: workspaceMembers.id,
      workspace_id: workspaceMembers.workspace_id,
      user_id: workspaceMembers.user_id,
      role: workspaceMembers.role,
      joined_at: workspaceMembers.joined_at,
      user: users
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.user_id, users.id))
    .where(eq(workspaceMembers.workspace_id, workspaceIdNum))
}

export async function removeWorkspaceMember(workspaceId: number | string, userId: number | string): Promise<void> {
  const workspaceIdNum = parseId(workspaceId)
  const userIdNum = parseId(userId)
  await db.delete(workspaceMembers).where(
    and(
      eq(workspaceMembers.workspace_id, workspaceIdNum),
      eq(workspaceMembers.user_id, userIdNum)
    )
  )
}

export async function updateMemberRole(workspaceId: number, userId: number, role: string): Promise<WorkspaceMember> {
  const [member] = await db
    .update(workspaceMembers)
    .set({ role })
    .where(
      and(
        eq(workspaceMembers.workspace_id, workspaceId),
        eq(workspaceMembers.user_id, userId)
      )
    )
    .returning()
  if (!member) {
    throw new Error('Failed to update workspace member role')
  }
  return member
}

// New function for API compatibility
export async function updateWorkspaceMemberRole(workspaceId: number | string, userId: number | string, role: string): Promise<WorkspaceMember> {
  const workspaceIdNum = parseId(workspaceId)
  const userIdNum = parseId(userId)
  return updateMemberRole(workspaceIdNum, userIdNum, role)
}

// Workspace tool queries
export async function enableWorkspaceTool(
  workspaceId: number,
  toolSlug: string,
  enabledBy: number,
  connectionConfig?: any
): Promise<WorkspaceTool> {
  const dbData = {
    workspace_id: workspaceId,
    tool_slug: toolSlug,
    enabled_by: enabledBy,
    connection_id: connectionConfig?.connectionId || null,
    config: connectionConfig || {},
    is_enabled: true
  }

  // Use upsert to handle existing tools
  const [tool] = await db
    .insert(workspaceTools)
    .values(dbData)
    .onConflictDoUpdate({
      target: [workspaceTools.workspace_id, workspaceTools.tool_slug],
      set: {
        is_enabled: true,
        // connection_id: dbData.connection_id, // Temporarily disabled until migration works
        config: dbData.config,
        enabled_at: new Date(),
      }
    })
    .returning()

  if (!tool) {
    throw new Error('Failed to enable workspace tool')
  }
  return tool
}

export async function getWorkspaceTools(workspaceId: number | string, _userId?: number | string): Promise<WorkspaceTool[]> {
  const workspaceIdNum = parseId(workspaceId)
  return await db
    .select()
    .from(workspaceTools)
    .where(eq(workspaceTools.workspace_id, workspaceIdNum))
}

export async function disableWorkspaceTool(
  workspaceId: number | string,
  toolSlug: string,
  connectionConfig?: any
): Promise<void> {
  const workspaceIdNum = parseId(workspaceId)
  const updateData: any = { is_enabled: false }

  // Update connection-related fields if provided
  if (connectionConfig) {
    if (connectionConfig.connectionId !== undefined) {
      updateData.connection_id = connectionConfig.connectionId
    }
    if (connectionConfig.config) {
      updateData.config = connectionConfig.config
    }
  }

  await db
    .update(workspaceTools)
    .set(updateData)
    .where(
      and(
        eq(workspaceTools.workspace_id, workspaceIdNum),
        eq(workspaceTools.tool_slug, toolSlug)
      )
    )
}

export async function getWorkspaceTool(workspaceId: number, toolSlug: string): Promise<WorkspaceTool | null> {
  const [tool] = await db
    .select()
    .from(workspaceTools)
    .where(
      and(
        eq(workspaceTools.workspace_id, workspaceId),
        eq(workspaceTools.tool_slug, toolSlug)
      )
    )
    .limit(1)

  return tool || null
}

export async function checkToolAccess(workspaceId: number, toolSlug: string): Promise<boolean> {
  const [tool] = await db
    .select()
    .from(workspaceTools)
    .where(
      and(
        eq(workspaceTools.workspace_id, workspaceId),
        eq(workspaceTools.tool_slug, toolSlug),
        eq(workspaceTools.is_enabled, true)
      )
    )
    .limit(1)

  return !!tool
}

export async function getWorkspaceWithPermissions(workspaceId: number, userId: number): Promise<any> {
  void userId; // Suppress unused parameter warning
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
    .then(rows => rows[0])

  if (!workspace) {
    return null
  }

  // Get workspace members
  const members = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspace_id, workspaceId))

  return {
    ...workspace,
    members
  }
}

// Tool usage queries
export async function recordToolUsage(
  userId: number,
  workspaceId: number,
  toolSlug: string,
  usageDate: Date
): Promise<ToolUsage>
export async function recordToolUsage(usageData: NewToolUsage): Promise<ToolUsage>
export async function recordToolUsage(
  userIdOrData: number | NewToolUsage,
  workspaceId?: number,
  toolSlug?: string,
  usageDate?: Date
): Promise<ToolUsage> {
  let usageData: NewToolUsage

  if (typeof userIdOrData === 'number') {
    // Called with individual parameters
    usageData = {
      user_id: userIdOrData,
      workspace_id: workspaceId!,
      tool_slug: toolSlug!,
      usage_date: usageDate!.toISOString().split('T')[0] as any,
      api_calls: 1,
    }
  } else {
    // Called with usage data object
    usageData = userIdOrData
  }

  // Use atomic upsert with onConflictDoUpdate
  const [result] = await db
    .insert(toolUsage)
    .values(usageData)
    .onConflictDoUpdate({
      target: [toolUsage.user_id, toolUsage.workspace_id, toolUsage.tool_slug, toolUsage.usage_date],
      set: {
        api_calls: sql`${toolUsage.api_calls} + EXCLUDED.api_calls`,
        updated_at: new Date(),
      },
    })
    .returning()

  if (!result) {
    throw new Error('Failed to record tool usage')
  }
  return result
}

export async function getToolUsageStats(
  userId: number,
  workspaceId: number,
  toolSlug?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ totalCalls: number; records: ToolUsage[] }> {
  // Add optional filters
  const conditions = [
    eq(toolUsage.user_id, userId),
    eq(toolUsage.workspace_id, workspaceId)
  ]

  if (toolSlug) {
    conditions.push(eq(toolUsage.tool_slug, toolSlug))
  }

  // Add date filters if provided
  if (startDate) {
    conditions.push(sql`${toolUsage.usage_date} >= ${startDate.toISOString().split('T')[0]}`)
  }

  if (endDate) {
    conditions.push(sql`${toolUsage.usage_date} <= ${endDate.toISOString().split('T')[0]}`)
  }

  const records = await db
    .select()
    .from(toolUsage)
    .where(and(...conditions))
    .orderBy(desc(toolUsage.usage_date))

  const totalCalls = records.reduce((sum, record) => sum + record.api_calls, 0)

  return { totalCalls, records }
}

// Permission checking functions
export async function isWorkspaceOwnerOrAdmin(workspaceId: number | string, userId: number | string): Promise<boolean> {
  const workspaceIdNum = parseId(workspaceId)
  const userIdNum = parseId(userId)

  // Check if user is the workspace owner
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceIdNum)).limit(1)
  if (workspace && workspace.owner_id === userIdNum) {
    return true
  }

  // Check if user is an admin member
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspace_id, workspaceIdNum),
        eq(workspaceMembers.user_id, userIdNum),
        eq(workspaceMembers.role, 'admin')
      )
    )
    .limit(1)

  return !!member
}

export async function isWorkspaceMemberOrOwner(workspaceId: number | string, userId: number | string): Promise<boolean> {
  const workspaceIdNum = parseId(workspaceId)
  const userIdNum = parseId(userId)

  // Check if user is the workspace owner
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceIdNum)).limit(1)
  if (workspace && workspace.owner_id === userIdNum) {
    return true
  }

  // Check if user is a member (any role)
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspace_id, workspaceIdNum),
        eq(workspaceMembers.user_id, userIdNum)
      )
    )
    .limit(1)

  return !!member
}

export async function getWorkspaceOwnerId(workspaceId: number | string): Promise<number | null> {
  const workspaceIdNum = parseId(workspaceId)
  const [workspace] = await db.select({ owner_id: workspaces.owner_id }).from(workspaces).where(eq(workspaces.id, workspaceIdNum)).limit(1)
  return workspace?.owner_id || null
}

export async function countWorkspaceAdmins(workspaceId: number | string): Promise<number> {
  const workspaceIdNum = parseId(workspaceId)
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspace_id, workspaceIdNum),
        eq(workspaceMembers.role, 'admin')
      )
    )

  return result[0]?.count || 0
}

export async function getWorkspaceMemberRole(workspaceId: number | string, userId: number | string): Promise<'admin' | 'member' | null> {
  const wsId = parseId(workspaceId)
  const uId = parseId(userId)
  const [row] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspace_id, wsId), eq(workspaceMembers.user_id, uId)))
    .limit(1)
  return (row?.role as 'admin' | 'member') ?? null
}

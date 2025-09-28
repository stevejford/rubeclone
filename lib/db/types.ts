// Enums for database values
export const UserPlan = {
  FREE: 'free',
  PRO: 'pro',
  COMPANY: 'company'
} as const

export const WorkspaceType = {
  PERSONAL: 'personal',
  COMPANY: 'company'
} as const

export const MemberRole = {
  ADMIN: 'admin',
  MEMBER: 'member'
} as const

export type UserPlanType = typeof UserPlan[keyof typeof UserPlan]
export type WorkspaceTypeType = typeof WorkspaceType[keyof typeof WorkspaceType]
export type MemberRoleType = typeof MemberRole[keyof typeof MemberRole]
export type WorkspaceMemberRole = MemberRoleType

// Query parameter types
export interface CreateUserParams {
  email: string
  name?: string
  image?: string
  password?: string
  plan?: UserPlanType
}

export interface CreateWorkspaceParams {
  name: string
  type?: WorkspaceTypeType
  owner_id: number
  description?: string
  ownerId?: number // For compatibility with API routes
}

export interface AddMemberParams {
  workspace_id: number
  user_id: number
  role?: MemberRoleType
  workspaceId?: string // For compatibility with API routes
  userId?: string // For compatibility with API routes
}

export interface EnableToolParams {
  workspace_id: number
  tool_slug: string
  enabled_by: number
  config?: Record<string, any>
  workspaceId?: string // For compatibility with API routes
  toolSlug?: string // For compatibility with API routes
}

export interface RecordUsageParams {
  user_id: number
  workspace_id: number
  tool_slug: string
  usage_date: string // YYYY-MM-DD format
  api_calls?: number
}

// Response types
export interface WorkspaceWithMembers {
  id: number
  name: string
  type: WorkspaceTypeType
  owner_id: number
  description?: string
  settings?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  members: Array<{
    id: number
    user_id: number
    role: MemberRoleType
    joined_at: Date
    user: {
      id: number
      email: string
      name?: string
      image?: string
    }
  }>
}

// Additional types for API compatibility
export interface Workspace {
  id: number
  name: string
  type: WorkspaceTypeType
  owner_id: number
  ownerId?: string // For compatibility with string IDs
  description?: string
  settings?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceWithDetails extends Workspace {
  members?: WorkspaceMember[]
  memberCount?: number
  toolCount?: number
}

export interface WorkspaceMember {
  id: number
  workspace_id: number
  workspaceId?: string // For compatibility
  user_id: number
  userId?: string // For compatibility
  role: MemberRoleType
  joined_at: Date
  user: {
    id: number | string
    name: string | null
    email: string
    image: string | null
  }
}

export interface WorkspaceTool {
  id: number
  workspace_id: number
  workspaceId?: string // For compatibility
  tool_slug: string
  toolSlug?: string // For compatibility
  enabled_by: number
  enabled_at: Date
  is_enabled: boolean
  config?: Record<string, any>
}

export interface WorkspaceWithTools {
  id: number
  name: string
  type: WorkspaceTypeType
  owner_id: number
  description?: string
  settings?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  tools: Array<{
    id: number
    tool_slug: string
    enabled_by: number
    enabled_at: Date
    is_enabled: boolean
    config?: Record<string, any>
  }>
}

export interface UsageStats {
  totalCalls: number
  dailyUsage: Array<{
    date: string
    calls: number
  }>
  toolBreakdown: Array<{
    tool_slug: string
    calls: number
  }>
}

export interface UserWithWorkspaces {
  id: number
  email: string
  name?: string
  image?: string
  plan: UserPlanType
  emailVerified?: Date
  createdAt: Date
  updatedAt: Date
  workspaces: Array<{
    id: number
    name: string
    type: WorkspaceTypeType
    role: MemberRoleType // User's role in this workspace
  }>
}

// API response formats
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Invitation types
export interface WorkspaceInvitation {
  workspace_id: number
  workspace_name: string
  invited_by: string
  invited_by_email: string
  role: MemberRoleType
  expires_at: Date
}

// Tool configuration types
export interface ToolConfig {
  [key: string]: any
}

// Common tool slugs (for reference)
export const CommonToolSlugs = {
  GMAIL: 'gmail',
  SLACK: 'slack',
  GITHUB: 'github',
  NOTION: 'notion',
  TRELLO: 'trello',
  ASANA: 'asana',
  JIRA: 'jira',
  DISCORD: 'discord',
  ZOOM: 'zoom',
  CALENDAR: 'calendar'
} as const

export type CommonToolSlugType = typeof CommonToolSlugs[keyof typeof CommonToolSlugs]

// Usage limits by plan
export const PlanLimits = {
  [UserPlan.FREE]: {
    maxWorkspaces: 1,
    maxMembersPerWorkspace: 3,
    maxToolsPerWorkspace: 5,
    maxApiCallsPerMonth: 1000
  },
  [UserPlan.PRO]: {
    maxWorkspaces: 5,
    maxMembersPerWorkspace: 10,
    maxToolsPerWorkspace: 20,
    maxApiCallsPerMonth: 10000
  },
  [UserPlan.COMPANY]: {
    maxWorkspaces: -1, // unlimited
    maxMembersPerWorkspace: -1, // unlimited
    maxToolsPerWorkspace: -1, // unlimited
    maxApiCallsPerMonth: -1 // unlimited
  }
} as const

export type PlanLimitsType = typeof PlanLimits[keyof typeof PlanLimits]

/**
 * Core TypeScript interfaces and types for the AI Tool Marketplace
 * These types define the domain models used throughout the application
 */

// Base entity interface
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// User related types
export interface User extends BaseEntity {
  email: string
  name?: string
  avatarUrl?: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: Date
  preferences: UserPreferences
  workspaces?: Workspace[]
}

export type UserRole = 'admin' | 'user' | 'developer'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: NotificationSettings
  dashboard: DashboardSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  marketing: boolean
  updates: boolean
}

export interface DashboardSettings {
  layout: 'grid' | 'list'
  itemsPerPage: number
  showPreview: boolean
}

// Workspace related types
export interface Workspace extends BaseEntity {
  name: string
  description?: string
  type: 'personal' | 'company'
  ownerId: string
  owner?: User
  settings: WorkspaceSettings
  tools: WorkspaceTool[]
  isPublic: boolean
  tags: string[]
  status: WorkspaceStatus
}

export interface WorkspaceWithDetails extends Workspace {
  members?: WorkspaceMember[]
  memberCount?: number
  toolCount?: number
}

export interface WorkspaceMember extends BaseEntity {
  workspaceId: string
  workspace?: Workspace
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  role: WorkspaceMemberRole
  invitedBy?: string
  invitedAt?: Date
  joinedAt?: Date
}

export type WorkspaceMemberRole = 'admin' | 'member'
export type WorkspaceStatus = 'active' | 'inactive' | 'archived'

export interface WorkspacePermissions {
  canManageMembers: boolean
  canManageTools: boolean
  canEditWorkspace: boolean
  canDeleteWorkspace: boolean
  canViewWorkspace: boolean
}

export interface WorkspaceSettings {
  autoSave: boolean
  collaborationEnabled: boolean
  maxTools: number
  customDomain?: string
  branding: BrandingSettings
}

export interface BrandingSettings {
  logo?: string
  primaryColor: string
  secondaryColor: string
  customCss?: string
}

// Tool related types
export interface Tool extends BaseEntity {
  name: string
  description: string
  category: ToolCategory
  provider: ToolProvider
  version: string
  config: ToolConfig
  isActive: boolean
  isPublic: boolean
  pricing: ToolPricing
  metadata: ToolMetadata
  requirements: ToolRequirements
  documentation?: ToolDocumentation
}

export type ToolCategory = 
  | 'ai-language'
  | 'automation'
  | 'data-processing'
  | 'integration'
  | 'analytics'
  | 'communication'
  | 'productivity'
  | 'development'
  | 'other'

export type ToolProvider = 
  | 'openai'
  | 'composio'
  | 'anthropic'
  | 'google'
  | 'microsoft'
  | 'custom'
  | 'community'

export interface ToolConfig {
  apiEndpoint?: string
  authType: 'api-key' | 'oauth' | 'basic' | 'none'
  requiredFields: ConfigField[]
  optionalFields: ConfigField[]
  defaultSettings: Record<string, any>
}

export interface ConfigField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea'
  label: string
  description?: string
  required: boolean
  options?: string[]
  validation?: ValidationRule[]
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
}

export interface ToolPricing {
  type: 'free' | 'freemium' | 'paid' | 'usage-based'
  price?: number
  currency: string
  billingPeriod?: 'monthly' | 'yearly' | 'one-time'
  usageLimits?: UsageLimits
}

export interface UsageLimits {
  requests?: number
  storage?: number
  users?: number
  period: 'hour' | 'day' | 'month' | 'year'
}

export interface ToolMetadata {
  tags: string[]
  rating: number
  reviewCount: number
  downloadCount: number
  lastUpdated: Date
  compatibility: string[]
  supportedLanguages: string[]
}

export interface ToolRequirements {
  minVersion?: string
  dependencies: string[]
  permissions: Permission[]
  resources: ResourceRequirements
}

export interface Permission {
  type: 'read' | 'write' | 'execute' | 'admin'
  resource: string
  description: string
}

export interface ResourceRequirements {
  memory?: number
  cpu?: number
  storage?: number
  network?: boolean
}

export interface ToolDocumentation {
  readme: string
  apiReference?: string
  examples: CodeExample[]
  changelog: string
  supportUrl?: string
}

export interface CodeExample {
  title: string
  description: string
  language: string
  code: string
  tags: string[]
}

// Workspace Tool relationship
export interface WorkspaceTool extends BaseEntity {
  workspaceId: string
  workspace?: Workspace
  toolSlug: string
  tool?: Tool
  config: Record<string, any>
  isEnabled: boolean
  connectionId?: string // Composio connection identifier
  position?: ToolPosition
  customName?: string
  notes?: string
  // Connection status derived from config
  connectionStatus?: 'connected' | 'disconnected' | 'error' | 'expired'
  isConnected?: boolean
  connectedAccount?: string
  lastSync?: Date
}

export interface ToolPosition {
  x: number
  y: number
  width: number
  height: number
}

// API and Integration types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  pagination?: PaginationInfo
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Search and Filter types
export interface SearchFilters {
  query?: string
  category?: ToolCategory
  provider?: ToolProvider
  pricing?: ToolPricing['type']
  tags?: string[]
  rating?: number
  sortBy?: SortOption
  sortOrder?: 'asc' | 'desc'
}

export type SortOption = 
  | 'name'
  | 'rating'
  | 'downloads'
  | 'updated'
  | 'created'
  | 'price'

// Form and UI types
export interface FormField {
  name: string
  label: string
  type: string
  value: any
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  helpText?: string
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

// Notification and Activity types
export interface Notification extends BaseEntity {
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  actionUrl?: string
  metadata?: Record<string, any>
}

export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'update'
  | 'promotion'

export interface Activity extends BaseEntity {
  userId: string
  workspaceId?: string
  toolId?: string
  action: ActivityAction
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export type ActivityAction = 
  | 'login'
  | 'logout'
  | 'create_workspace'
  | 'update_workspace'
  | 'delete_workspace'
  | 'add_tool'
  | 'remove_tool'
  | 'configure_tool'
  | 'run_workflow'
  | 'export_data'
  | 'import_data'

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Environment and Configuration types
export interface AppConfig {
  app: {
    name: string
    version: string
    environment: 'development' | 'staging' | 'production'
    url: string
  }
  database: {
    url: string
    ssl: boolean
    poolSize: number
  }
  auth: {
    secret: string
    providers: AuthProvider[]
    sessionTimeout: number
  }
  integrations: {
    openai: IntegrationConfig
    composio: IntegrationConfig
    stripe?: IntegrationConfig
  }
}

export interface AuthProvider {
  name: string
  enabled: boolean
  clientId?: string
  clientSecret?: string
}

export interface IntegrationConfig {
  enabled: boolean
  apiKey?: string
  baseUrl?: string
  timeout?: number
  retries?: number
}

// Re-export Composio types for convenience
export type {
  ComposioConnection,
  ConnectionStatus,
  ConnectionMetadata,
  ComposioToolkit,
  ComposioAction,
  ToolExecutionRequest,
  ToolExecutionResponse,
  ConnectionStatusInfo,
  ComposioUserContext,
  WorkspaceToolWithConnection,
} from './composio'

// Re-export Marketplace types for convenience
export type {
  RealMarketplaceApp,
  PartnerApiApp,
  PartnerApiResponse,
  MarketplaceFilters,
  SearchParams,
  PaginationInfo as MarketplacePaginationInfo,
  MarketplaceResponse,
  ToolkitDetails,
  ComposioTool,
  AppInstallationStatus,
  CategoryInfo,
  SearchSuggestion,
  AppSortOption,
  AppViewMode,
  PricingFilter,
  AuthFilter,
  MarketplaceApp, // Legacy - deprecated
} from './marketplace'

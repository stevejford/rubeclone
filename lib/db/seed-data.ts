import {
  type NewUser
} from './schema'

// Sample users with different plans
export const users: NewUser[] = [
  {
    email: 'john.doe@example.com',
    name: 'John Doe',
    plan: 'free',
    role: 'user',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    plan: 'pro',
    role: 'user',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    createdAt: new Date('2024-01-10T14:30:00Z'),
    updatedAt: new Date('2024-01-10T14:30:00Z')
  },
  {
    email: 'mike.johnson@company.com',
    name: 'Mike Johnson',
    plan: 'company',
    role: 'user',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    createdAt: new Date('2024-01-05T09:15:00Z'),
    updatedAt: new Date('2024-01-05T09:15:00Z')
  },
  {
    email: 'sarah.wilson@startup.io',
    name: 'Sarah Wilson',
    plan: 'pro',
    role: 'user',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    createdAt: new Date('2024-01-20T16:45:00Z'),
    updatedAt: new Date('2024-01-20T16:45:00Z')
  },
  {
    email: 'alex.brown@freelance.com',
    name: 'Alex Brown',
    plan: 'free',
    role: 'user',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    createdAt: new Date('2024-01-25T11:20:00Z'),
    updatedAt: new Date('2024-01-25T11:20:00Z')
  }
]

// Sample workspaces (both personal and company) - using owner_email instead of owner_id
export const workspaces = [
  {
    name: "John's Personal Workspace",
    type: 'personal',
    owner_email: 'john.doe@example.com', // John Doe
    description: 'Personal productivity workspace',
    settings: { theme: 'light', notifications: true },
    createdAt: new Date('2024-01-15T10:05:00Z'),
    updatedAt: new Date('2024-01-15T10:05:00Z')
  },
  {
    name: 'Design Studio Pro',
    type: 'company',
    owner_email: 'jane.smith@example.com', // Jane Smith
    description: 'Professional design team workspace',
    settings: { theme: 'dark', notifications: true, integrations: ['slack', 'figma'] },
    createdAt: new Date('2024-01-10T14:35:00Z'),
    updatedAt: new Date('2024-01-10T14:35:00Z')
  },
  {
    name: 'Enterprise Solutions',
    type: 'company',
    owner_email: 'mike.johnson@company.com', // Mike Johnson
    description: 'Large enterprise workspace for development team',
    settings: { theme: 'light', notifications: true, sso: true },
    createdAt: new Date('2024-01-05T09:20:00Z'),
    updatedAt: new Date('2024-01-05T09:20:00Z')
  },
  {
    name: 'Startup Hub',
    type: 'company',
    owner_email: 'sarah.wilson@startup.io', // Sarah Wilson
    description: 'Fast-moving startup workspace',
    settings: { theme: 'dark', notifications: true, rapid_deployment: true },
    createdAt: new Date('2024-01-20T16:50:00Z'),
    updatedAt: new Date('2024-01-20T16:50:00Z')
  },
  {
    name: "Alex's Freelance Space",
    type: 'personal',
    owner_email: 'alex.brown@freelance.com', // Alex Brown
    description: 'Freelance project management',
    settings: { theme: 'light', notifications: false },
    createdAt: new Date('2024-01-25T11:25:00Z'),
    updatedAt: new Date('2024-01-25T11:25:00Z')
  }
]

// Sample workspace members - using workspace_name and user_email instead of IDs
export const workspaceMembers = [
  // Design Studio Pro members
  {
    workspace_name: 'Design Studio Pro',
    user_email: 'jane.smith@example.com', // Jane Smith (owner, admin)
    role: 'admin',
    joined_at: new Date('2024-01-10T14:35:00Z')
  },
  {
    workspace_name: 'Design Studio Pro',
    user_email: 'alex.brown@freelance.com', // Alex Brown as member
    role: 'member',
    joined_at: new Date('2024-01-26T09:00:00Z')
  },
  // Enterprise Solutions members
  {
    workspace_name: 'Enterprise Solutions',
    user_email: 'mike.johnson@company.com', // Mike Johnson (owner, admin)
    role: 'admin',
    joined_at: new Date('2024-01-05T09:20:00Z')
  },
  {
    workspace_name: 'Enterprise Solutions',
    user_email: 'john.doe@example.com', // John Doe as member
    role: 'member',
    joined_at: new Date('2024-01-16T10:00:00Z')
  },
  {
    workspace_name: 'Enterprise Solutions',
    user_email: 'sarah.wilson@startup.io', // Sarah Wilson as admin
    role: 'admin',
    joined_at: new Date('2024-01-21T08:30:00Z')
  },
  // Startup Hub members
  {
    workspace_name: 'Startup Hub',
    user_email: 'sarah.wilson@startup.io', // Sarah Wilson (owner, admin)
    role: 'admin',
    joined_at: new Date('2024-01-20T16:50:00Z')
  },
  {
    workspace_name: 'Startup Hub',
    user_email: 'jane.smith@example.com', // Jane Smith as member
    role: 'member',
    joined_at: new Date('2024-01-22T14:00:00Z')
  }
]

// Sample workspace tools - using workspace_name and enabled_by_email instead of IDs
export const workspaceTools = [
  // John's Personal Workspace tools
  {
    workspace_name: "John's Personal Workspace",
    tool_slug: 'gmail',
    enabled_by_email: 'john.doe@example.com',
    enabled_at: new Date('2024-01-15T10:10:00Z'),
    is_enabled: true,
    config: { auto_sync: true, labels: ['work', 'personal'] }
  },
  {
    workspace_name: "John's Personal Workspace",
    tool_slug: 'calendar',
    enabled_by_email: 'john.doe@example.com',
    enabled_at: new Date('2024-01-15T10:15:00Z'),
    is_enabled: true,
    config: { sync_frequency: 'hourly' }
  },
  // Design Studio Pro tools
  {
    workspace_name: 'Design Studio Pro',
    tool_slug: 'slack',
    enabled_by_email: 'jane.smith@example.com',
    enabled_at: new Date('2024-01-10T14:40:00Z'),
    is_enabled: true,
    config: { channels: ['general', 'design', 'clients'] }
  },
  {
    workspace_name: 'Design Studio Pro',
    tool_slug: 'notion',
    enabled_by_email: 'jane.smith@example.com',
    enabled_at: new Date('2024-01-10T14:45:00Z'),
    is_enabled: true,
    config: { workspace_id: 'design-studio-123' }
  },
  {
    workspace_name: 'Design Studio Pro',
    tool_slug: 'github',
    enabled_by_email: 'jane.smith@example.com',
    enabled_at: new Date('2024-01-11T09:00:00Z'),
    is_enabled: true,
    config: { organization: 'design-studio-pro' }
  },
  // Enterprise Solutions tools
  {
    workspace_name: 'Enterprise Solutions',
    tool_slug: 'jira',
    enabled_by_email: 'mike.johnson@company.com',
    enabled_at: new Date('2024-01-05T09:25:00Z'),
    is_enabled: true,
    config: { project_key: 'ENT', board_id: 123 }
  },
  {
    workspace_name: 'Enterprise Solutions',
    tool_slug: 'github',
    enabled_by_email: 'mike.johnson@company.com',
    enabled_at: new Date('2024-01-05T09:30:00Z'),
    is_enabled: true,
    config: { organization: 'enterprise-solutions' }
  },
  {
    workspace_name: 'Enterprise Solutions',
    tool_slug: 'slack',
    enabled_by_email: 'mike.johnson@company.com',
    enabled_at: new Date('2024-01-05T09:35:00Z'),
    is_enabled: true,
    config: { channels: ['dev-team', 'announcements', 'support'] }
  },
  // Startup Hub tools
  {
    workspace_name: 'Startup Hub',
    tool_slug: 'discord',
    enabled_by_email: 'sarah.wilson@startup.io',
    enabled_at: new Date('2024-01-20T17:00:00Z'),
    is_enabled: true,
    config: { server_id: 'startup-hub-456' }
  },
  {
    workspace_name: 'Startup Hub',
    tool_slug: 'trello',
    enabled_by_email: 'sarah.wilson@startup.io',
    enabled_at: new Date('2024-01-20T17:05:00Z'),
    is_enabled: true,
    config: { board_id: 'startup-board-789' }
  }
]

// Sample tool usage data - using workspace_name and user_email instead of IDs
export const toolUsage = [
  // Recent usage data for different users and tools
  {
    user_email: 'john.doe@example.com',
    workspace_name: "John's Personal Workspace",
    tool_slug: 'gmail',
    usage_date: '2024-01-26',
    api_calls: 45,
    created_at: new Date('2024-01-26T10:00:00Z'),
    updated_at: new Date('2024-01-26T10:00:00Z')
  },
  {
    user_email: 'john.doe@example.com',
    workspace_name: "John's Personal Workspace",
    tool_slug: 'calendar',
    usage_date: '2024-01-26',
    api_calls: 12,
    created_at: new Date('2024-01-26T10:00:00Z'),
    updated_at: new Date('2024-01-26T10:00:00Z')
  },
  {
    user_email: 'jane.smith@example.com',
    workspace_name: 'Design Studio Pro',
    tool_slug: 'slack',
    usage_date: '2024-01-26',
    api_calls: 89,
    created_at: new Date('2024-01-26T11:00:00Z'),
    updated_at: new Date('2024-01-26T11:00:00Z')
  },
  {
    user_email: 'jane.smith@example.com',
    workspace_name: 'Design Studio Pro',
    tool_slug: 'notion',
    usage_date: '2024-01-26',
    api_calls: 34,
    created_at: new Date('2024-01-26T11:00:00Z'),
    updated_at: new Date('2024-01-26T11:00:00Z')
  },
  {
    user_email: 'mike.johnson@company.com',
    workspace_name: 'Enterprise Solutions',
    tool_slug: 'jira',
    usage_date: '2024-01-26',
    api_calls: 156,
    created_at: new Date('2024-01-26T12:00:00Z'),
    updated_at: new Date('2024-01-26T12:00:00Z')
  },
  {
    user_email: 'mike.johnson@company.com',
    workspace_name: 'Enterprise Solutions',
    tool_slug: 'github',
    usage_date: '2024-01-26',
    api_calls: 78,
    created_at: new Date('2024-01-26T12:00:00Z'),
    updated_at: new Date('2024-01-26T12:00:00Z')
  },
  // Previous day data
  {
    user_email: 'john.doe@example.com',
    workspace_name: "John's Personal Workspace",
    tool_slug: 'gmail',
    usage_date: '2024-01-25',
    api_calls: 38,
    created_at: new Date('2024-01-25T10:00:00Z'),
    updated_at: new Date('2024-01-25T10:00:00Z')
  },
  {
    user_email: 'jane.smith@example.com',
    workspace_name: 'Design Studio Pro',
    tool_slug: 'slack',
    usage_date: '2024-01-25',
    api_calls: 92,
    created_at: new Date('2024-01-25T11:00:00Z'),
    updated_at: new Date('2024-01-25T11:00:00Z')
  }
]

export const seedData = {
  users,
  workspaces,
  workspaceMembers,
  workspaceTools,
  toolUsage
}

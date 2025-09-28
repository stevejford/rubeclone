import { RealMarketplaceApp } from '@/types/marketplace'

/**
 * @deprecated Use RealMarketplaceApp from @/types/marketplace instead
 * This interface is kept for backward compatibility only
 */
export interface MarketplaceApp {
  id: string
  name: string
  description: string
  icon: string
  iconBg: string
  stars: number
  views: string
  category: string
  provider: string
  isInstalled?: boolean
  isFeatured?: boolean
  tags: string[]
  longDescription?: string
  screenshots?: string[]
  pricing?: 'free' | 'paid' | 'freemium'
  usageStats?: {
    installs: number
    activeWorkspaces: number
    last30dRuns: number
  }
  // Composio-specific fields for OAuth integration
  requiresOAuth?: boolean
  composioToolkit?: string
  authScopes?: string[]
  connectionBenefits?: string[]
  privacyNotice?: string
}

export const marketplaceApps: MarketplaceApp[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: "Gmail is Google's email service, featuring spam protection, search functions, and streamlined interface for efficient email management.",
    icon: 'G',
    iconBg: 'bg-red-500',
    stars: 24,
    views: '73K',
    category: 'Communication',
    provider: 'Google',
    isFeatured: true,
    tags: ['email', 'google', 'communication'],
    pricing: 'free',
    longDescription: 'Gmail is a free email service provided by Google. Users can access Gmail on the web and using third-party programs that synchronize email content through POP or IMAP protocols.',
    usageStats: {
      installs: 12500,
      activeWorkspaces: 8900,
      last30dRuns: 45600
    },
    // Composio OAuth integration
    requiresOAuth: true,
    composioToolkit: 'gmail',
    authScopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    connectionBenefits: [
      'Send emails directly from AI agents',
      'Read and analyze email content',
      'Automate email workflows',
      'Access Gmail labels and filters'
    ],
    privacyNotice: 'Your Gmail credentials are securely stored by Composio and never shared with third parties.'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub is a code hosting platform for version control and collaboration, offering Git-based repository management and team workflows.',
    icon: 'G',
    iconBg: 'bg-gray-900',
    stars: 825,
    views: '89.9K',
    category: 'Developer Tools',
    provider: 'GitHub',
    isFeatured: true,
    tags: ['git', 'code', 'collaboration', 'development'],
    pricing: 'freemium',
    longDescription: 'GitHub is a web-based version control repository hosting service, primarily for computer code. It offers distributed version control and source code management functionality.',
    usageStats: {
      installs: 18700,
      activeWorkspaces: 15200,
      last30dRuns: 89300
    },
    // Composio OAuth integration
    requiresOAuth: true,
    composioToolkit: 'github',
    authScopes: ['repo', 'user:email', 'read:org'],
    connectionBenefits: [
      'Create and manage repositories',
      'Automate pull requests and issues',
      'Access repository analytics',
      'Manage team permissions'
    ],
    privacyNotice: 'Your GitHub credentials are securely managed by Composio with enterprise-grade security.'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Notion centralizes notes, docs, wikis, and tasks in a unified workspace, letting teams build custom workflows and knowledge bases.',
    icon: 'N',
    iconBg: 'bg-black',
    stars: 26,
    views: '89.4K',
    category: 'Productivity',
    provider: 'Notion Labs',
    isFeatured: true,
    tags: ['notes', 'docs', 'productivity', 'collaboration'],
    pricing: 'freemium',
    longDescription: 'Notion is an application that provides components such as notes, databases, kanban boards, wikis, calendars and reminders.',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Slack is a channel-based messaging platform. With Slack, people can work together more effectively, connect all their software tools.',
    icon: 'S',
    iconBg: 'bg-purple-600',
    stars: 156,
    views: '45.2K',
    category: 'Communication',
    provider: 'Slack Technologies',
    isFeatured: true,
    tags: ['messaging', 'team', 'collaboration', 'chat'],
    pricing: 'freemium',
    longDescription: 'Slack is a cloud-based set of proprietary team collaboration tools and services, founded by Stewart Butterfield, Eric Costello, Cal Henderson, and Serguei Mourachov.',
    usageStats: {
      installs: 9800,
      activeWorkspaces: 7200,
      last30dRuns: 34500
    }
  },
  {
    id: 'twitter',
    name: 'Twitter',
    description: 'Twitter, Inc. was an American social media company based in San Francisco, California, which operated the microblogging website Twitter.',
    icon: 'X',
    iconBg: 'bg-black',
    stars: 89,
    views: '67.8K',
    category: 'Social Media',
    provider: 'X Corp',
    isFeatured: true,
    tags: ['social', 'microblogging', 'news', 'communication'],
    pricing: 'freemium',
    longDescription: 'Twitter is a microblogging and social networking service on which users post and interact with messages known as "tweets".',
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Linear is a streamlined issue tracking tool for modern software teams, designed for speed and simplicity in project management.',
    icon: 'L',
    iconBg: 'bg-blue-600',
    stars: 342,
    views: '34.1K',
    category: 'Project Management',
    provider: 'Linear',
    isFeatured: true,
    tags: ['project management', 'issues', 'tracking', 'development'],
    pricing: 'freemium',
    longDescription: 'Linear is the issue tracking tool streamlined for modern software teams. It helps you track issues, plan sprints, and build better products.',
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Figma is a collaborative web application for interface design, with additional offline features enabled by desktop applications.',
    icon: 'F',
    iconBg: 'bg-purple-500',
    stars: 567,
    views: '78.3K',
    category: 'Design',
    provider: 'Figma',
    tags: ['design', 'ui', 'collaboration', 'prototyping'],
    pricing: 'freemium',
    longDescription: 'Figma is a vector graphics editor and prototyping tool which is primarily web-based, with additional offline features enabled by desktop applications.',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Discord is a VoIP and instant messaging social platform. Users have the ability to communicate with voice calls, video calls, text messaging.',
    icon: 'D',
    iconBg: 'bg-indigo-600',
    stars: 234,
    views: '56.7K',
    category: 'Communication',
    provider: 'Discord Inc.',
    tags: ['voice', 'chat', 'gaming', 'community'],
    pricing: 'freemium',
    longDescription: 'Discord is a VoIP, instant messaging and digital distribution platform designed for creating communities.',
  }
]

/**
 * @deprecated Use getAllCategories() from @/lib/constants/categories instead
 */
export const categories = [
  'Featured',
  'Developer Tools',
  'Communication',
  'Productivity',
  'Project Management',
  'Design',
  'Social Media',
  'AI & ML',
  'File Management',
  'CRM',
  'Analytics & Data',
  'Entertainment & Media'
]

/**
 * @deprecated Use the new marketplace service instead
 * This function is kept for backward compatibility only
 */
export function getAppsByCategory(category: string): MarketplaceApp[] {
  if (category === 'Featured') {
    return marketplaceApps.filter(app => app.isFeatured)
  }
  return marketplaceApps.filter(app => app.category === category)
}

/**
 * @deprecated Use the new marketplace service instead
 * This function is kept for backward compatibility only
 */
export function searchApps(query: string): MarketplaceApp[] {
  const lowercaseQuery = query.toLowerCase()
  return marketplaceApps.filter(app =>
    app.name.toLowerCase().includes(lowercaseQuery) ||
    app.description.toLowerCase().includes(lowercaseQuery) ||
    app.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

/**
 * Migration utility: Convert legacy MarketplaceApp to RealMarketplaceApp
 */
export function migrateLegacyApp(legacyApp: MarketplaceApp): RealMarketplaceApp {
  return {
    slug: legacyApp.id,
    name: legacyApp.name,
    description: legacyApp.description,
    logo: undefined, // Legacy apps don't have logos
    category: [legacyApp.category.toLowerCase()],
    tool_count: undefined, // Legacy apps don't have tool counts
    mcp_url: undefined,
    requires_auth: legacyApp.requiresOAuth || false,
    auth_schemes: legacyApp.authScopes || [],
    pricing: legacyApp.pricing || 'free',
    tags: legacyApp.tags,
    website_url: undefined,
    documentation_url: undefined,
    support_url: undefined,
    created_at: undefined,
    updated_at: undefined,
    popularity_score: legacyApp.stars,
    rating: legacyApp.stars / 5, // Convert stars to rating
    review_count: undefined,
  }
}

/**
 * Fallback data for development when Partner API is unavailable
 */
export function getFallbackApps(): RealMarketplaceApp[] {
  return marketplaceApps.map(migrateLegacyApp)
}

/**
 * Data validation utility
 */
export function validateLegacyAppData(app: any): app is MarketplaceApp {
  return (
    typeof app === 'object' &&
    typeof app.id === 'string' &&
    typeof app.name === 'string' &&
    typeof app.description === 'string' &&
    typeof app.category === 'string' &&
    Array.isArray(app.tags)
  )
}

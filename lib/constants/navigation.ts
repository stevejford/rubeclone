import {
  Home,
  Store,
  Briefcase,
  Settings,
  User,
  Plus
} from 'lucide-react'

export interface NavigationItem {
  href: string
  label: string
  icon: typeof Home
  description?: string
}

export const publicNavigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    description: 'Welcome to AI Tool Marketplace'
  },
  {
    href: '/marketplace',
    label: 'Marketplace',
    icon: Store,
    description: 'Browse and discover AI tools'
  },
]

export const authenticatedNavigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Your personal dashboard'
  },
  {
    href: '/marketplace',
    label: 'Marketplace',
    icon: Store,
    description: 'Browse and install AI tools'
  },
  {
    href: '/workspaces',
    label: 'Workspaces',
    icon: Briefcase,
    description: 'Manage your workspaces'
  },
]

export const userMenuItems = [
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    description: 'Account and preferences'
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
    description: 'Your profile information'
  },
]

export const workspaceMenuItems = [
  {
    href: '/workspaces/new',
    label: 'Create Workspace',
    icon: Plus,
    description: 'Create a new workspace'
  },
  {
    href: '/workspaces',
    label: 'Manage Workspaces',
    icon: Settings,
    description: 'Manage all workspaces'
  },
]

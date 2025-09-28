import {
  Mail,
  Github,
  FileText,
  MessageSquare,
  Calendar,
  Figma,
  Trello,
  Zap,
  Database,
  BarChart3,
  Video,
  Music,
  LucideProps
} from 'lucide-react'

// Icon mapping for known tools
const TOOL_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  gmail: Mail,
  github: Github,
  notion: FileText,
  slack: MessageSquare,
  calendar: Calendar,
  figma: Figma,
  trello: Trello,
  zapier: Zap,
  airtable: Database,
  analytics: BarChart3,
  zoom: Video,
  spotify: Music,
  discord: MessageSquare,
  linear: Trello,
}

/**
 * Get the appropriate icon component for a tool
 * @param toolId - The ID of the tool
 * @param fallbackLetter - Letter to show if no icon is found
 * @returns React component for the icon or null if no custom icon
 */
export function getToolIcon(toolId: string): React.ComponentType<LucideProps> | null {
  const IconComponent = TOOL_ICON_MAP[toolId.toLowerCase()]
  return IconComponent || null
}

/**
 * Check if a tool has a custom icon
 * @param toolId - The ID of the tool
 * @returns boolean indicating if custom icon exists
 */
export function hasCustomIcon(toolId: string): boolean {
  return toolId.toLowerCase() in TOOL_ICON_MAP
}

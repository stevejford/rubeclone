import { 
  MessageSquare, 
  Calendar, 
  FileText, 
  Users, 
  BarChart3, 
  ShoppingCart, 
  Code, 
  Database, 
  Mail, 
  Camera,
  Music,
  Video,
  Globe,
  Shield,
  Zap,
  Briefcase,
  Heart,
  Gamepad2,
  GraduationCap,
  Home,
  Car,
  Plane,
  DollarSign,
  Settings
} from 'lucide-react';

export interface CategoryMapping {
  partnerKey: string;
  displayName: string;
  icon: any;
  iconName: string;
  description: string;
  color: string;
  appCount?: number;
}

export const CATEGORY_MAPPING: Record<string, CategoryMapping> = {
  'collaboration & communication': {
    partnerKey: 'collaboration & communication',
    displayName: 'Communication',
    icon: MessageSquare,
    iconName: 'MessageSquare',
    description: 'Team collaboration and communication tools',
    color: 'bg-blue-500'
  },
  'productivity': {
    partnerKey: 'productivity',
    displayName: 'Productivity',
    icon: Calendar,
    iconName: 'Calendar',
    description: 'Tools to boost productivity and efficiency',
    color: 'bg-green-500'
  },
  'content creation': {
    partnerKey: 'content creation',
    displayName: 'Content Creation',
    icon: FileText,
    iconName: 'FileText',
    description: 'Create and manage content',
    color: 'bg-purple-500'
  },
  'crm': {
    partnerKey: 'crm',
    displayName: 'CRM',
    icon: Users,
    iconName: 'Users',
    description: 'Customer relationship management',
    color: 'bg-orange-500'
  },
  'analytics': {
    partnerKey: 'analytics',
    displayName: 'Analytics',
    icon: BarChart3,
    iconName: 'BarChart3',
    description: 'Data analysis and reporting tools',
    color: 'bg-indigo-500'
  },
  'e-commerce': {
    partnerKey: 'e-commerce',
    displayName: 'E-commerce',
    icon: ShoppingCart,
    iconName: 'ShoppingCart',
    description: 'Online store and sales tools',
    color: 'bg-pink-500'
  },
  'development': {
    partnerKey: 'development',
    displayName: 'Development',
    icon: Code,
    iconName: 'Code',
    description: 'Developer tools and APIs',
    color: 'bg-gray-500'
  },
  'database': {
    partnerKey: 'database',
    displayName: 'Database',
    icon: Database,
    iconName: 'Database',
    description: 'Database management and storage',
    color: 'bg-yellow-500'
  },
  'email': {
    partnerKey: 'email',
    displayName: 'Email',
    icon: Mail,
    iconName: 'Mail',
    description: 'Email marketing and management',
    color: 'bg-red-500'
  },
  'social media': {
    partnerKey: 'social media',
    displayName: 'Social Media',
    icon: Camera,
    iconName: 'Camera',
    description: 'Social media management and marketing',
    color: 'bg-cyan-500'
  },
  'music': {
    partnerKey: 'music',
    displayName: 'Music',
    icon: Music,
    iconName: 'Music',
    description: 'Music streaming and audio tools',
    color: 'bg-violet-500'
  },
  'video': {
    partnerKey: 'video',
    displayName: 'Video',
    icon: Video,
    iconName: 'Video',
    description: 'Video creation and streaming',
    color: 'bg-rose-500'
  },
  'web services': {
    partnerKey: 'web services',
    displayName: 'Web Services',
    icon: Globe,
    iconName: 'Globe',
    description: 'Web-based services and APIs',
    color: 'bg-teal-500'
  },
  'security': {
    partnerKey: 'security',
    displayName: 'Security',
    icon: Shield,
    iconName: 'Shield',
    description: 'Security and authentication tools',
    color: 'bg-slate-500'
  },
  'automation': {
    partnerKey: 'automation',
    displayName: 'Automation',
    icon: Zap,
    iconName: 'Zap',
    description: 'Workflow automation tools',
    color: 'bg-amber-500'
  },
  'business': {
    partnerKey: 'business',
    displayName: 'Business',
    icon: Briefcase,
    iconName: 'Briefcase',
    description: 'Business management tools',
    color: 'bg-emerald-500'
  },
  'health & fitness': {
    partnerKey: 'health & fitness',
    displayName: 'Health & Fitness',
    icon: Heart,
    iconName: 'Heart',
    description: 'Health and fitness tracking',
    color: 'bg-red-400'
  },
  'gaming': {
    partnerKey: 'gaming',
    displayName: 'Gaming',
    icon: Gamepad2,
    iconName: 'Gamepad2',
    description: 'Gaming platforms and tools',
    color: 'bg-purple-600'
  },
  'education': {
    partnerKey: 'education',
    displayName: 'Education',
    icon: GraduationCap,
    iconName: 'GraduationCap',
    description: 'Educational tools and platforms',
    color: 'bg-blue-600'
  },
  'real estate': {
    partnerKey: 'real estate',
    displayName: 'Real Estate',
    icon: Home,
    iconName: 'Home',
    description: 'Real estate management tools',
    color: 'bg-green-600'
  },
  'transportation': {
    partnerKey: 'transportation',
    displayName: 'Transportation',
    icon: Car,
    iconName: 'Car',
    description: 'Transportation and logistics',
    color: 'bg-gray-600'
  },
  'travel': {
    partnerKey: 'travel',
    displayName: 'Travel',
    icon: Plane,
    iconName: 'Plane',
    description: 'Travel booking and management',
    color: 'bg-sky-500'
  },
  'finance': {
    partnerKey: 'finance',
    displayName: 'Finance',
    icon: DollarSign,
    iconName: 'DollarSign',
    description: 'Financial services and tools',
    color: 'bg-green-700'
  }
};

export const UI_CATEGORIES = Object.values(CATEGORY_MAPPING).sort((a, b) => 
  a.displayName.localeCompare(b.displayName)
);

export function mapPartnerCategory(partnerCategory: string): CategoryMapping {
  const normalized = partnerCategory.toLowerCase().trim();
  return CATEGORY_MAPPING[normalized] || {
    partnerKey: partnerCategory,
    displayName: partnerCategory.charAt(0).toUpperCase() + partnerCategory.slice(1),
    icon: Settings,
    iconName: 'Settings',
    description: `${partnerCategory} tools and services`,
    color: 'bg-gray-400'
  };
}

export function getCategoryIcon(category: string) {
  const mapping = mapPartnerCategory(category);
  return mapping.icon;
}

// Helper function to get icon component from icon name
export function getIconComponent(iconName: string) {
  const iconMap: Record<string, any> = {
    MessageSquare,
    Calendar,
    FileText,
    Users,
    BarChart3,
    ShoppingCart,
    Code,
    Database,
    Mail,
    Camera,
    Music,
    Video,
    Globe,
    Shield,
    Zap,
    Briefcase,
    Heart,
    Gamepad2,
    GraduationCap,
    Home,
    Car,
    Plane,
    DollarSign,
    Settings
  };

  return iconMap[iconName] || Settings;
}

export function getCategoryDisplayName(category: string): string {
  const mapping = mapPartnerCategory(category);
  return mapping.displayName;
}

export function getCategoryColor(category: string): string {
  const mapping = mapPartnerCategory(category);
  return mapping.color;
}

export function getAllCategories(): CategoryMapping[] {
  return UI_CATEGORIES;
}

export function getCategoryByDisplayName(displayName: string): CategoryMapping | undefined {
  return UI_CATEGORIES.find(cat => cat.displayName === displayName);
}

// Helper function to handle multiple categories per app
export function mapAppCategories(categories: string[]): CategoryMapping[] {
  return categories.map(mapPartnerCategory);
}

// Get primary category (first one) for apps with multiple categories
export function getPrimaryCategory(categories: string[]): CategoryMapping {
  const firstCategory = categories.length > 0 && categories[0] ? categories[0] : 'other';
  return mapPartnerCategory(firstCategory);
}

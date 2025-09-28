import { RealMarketplaceApp } from '@/types/marketplace';
import { mapPartnerCategory } from '@/lib/constants/categories';

/**
 * Normalize Partner API app response to internal RealMarketplaceApp format
 */
export function normalizePartnerApp(partnerApp: any): RealMarketplaceApp {
  // Handle the actual API response structure
  const meta = partnerApp.meta || {};
  const categories = meta.categories || [];

  // Extract category names from the API structure - now supports multiple categories
  const categoryNames = categories.map((cat: any) => cat.name || cat.id || 'other');

  // Determine pricing based on auth requirements (improved logic)
  let pricing: 'free' | 'paid' | 'freemium' = 'free';
  if (partnerApp.no_auth) {
    pricing = 'free';
  } else if (partnerApp.auth_schemes && partnerApp.auth_schemes.length > 0) {
    // Check if Composio manages any auth schemes (usually indicates freemium)
    const managedSchemes = partnerApp.composio_managed_auth_schemes || [];
    pricing = managedSchemes.length > 0 ? 'freemium' : 'paid';
  }

  // Calculate popularity score based on tool count and triggers
  const toolCount = meta.tools_count || 0;
  const triggerCount = meta.triggers_count || 0;
  const popularityScore = Math.min(100, (toolCount * 2) + (triggerCount * 5));

  return {
    slug: partnerApp.slug,
    name: partnerApp.name,
    description: meta.description || 'No description available',
    logo: extractAppLogo(partnerApp) || generateAppIcon(partnerApp.name),
    category: categoryNames.map((cat: string) => cat.toLowerCase().trim()),
    tool_count: toolCount,
    mcp_url: `https://mcp.composio.dev/${partnerApp.slug}`,
    requires_auth: !partnerApp.no_auth,
    auth_schemes: partnerApp.auth_schemes || [],
    pricing,
    tags: [], // Could be derived from categories if needed
    website_url: meta.app_url,
    documentation_url: undefined, // Not provided in current API
    support_url: undefined, // Not provided in current API
    created_at: meta.created_at,
    updated_at: meta.updated_at,
    popularity_score: popularityScore,
    rating: 0, // Not provided in current API
    review_count: 0, // Not provided in current API
  };
}

/**
 * Extract and optimize app logo from Composio API response
 */
export function extractAppLogo(partnerApp: any): string | undefined {
  const meta = partnerApp.meta || {};
  const logoUrl = meta.logo;

  if (!logoUrl) {
    return undefined;
  }

  // Optimize logo URL for better performance and quality
  if (logoUrl.includes('logos.composio.dev/api/')) {
    // Composio's logo API - already optimized
    return logoUrl;
  } else if (logoUrl.includes('cdn.jsdelivr.net/gh/ComposioHQ/open-logos')) {
    // Open logos CDN - already optimized
    return logoUrl;
  } else if (logoUrl.includes('favicon.ico')) {
    // Favicon URLs - might be low quality, but keep as fallback
    return logoUrl;
  } else {
    // External logo URLs - use as-is but could be optimized
    return logoUrl;
  }
}

/**
 * Generate a fallback icon URL for apps without logos
 */
export function generateAppIcon(appName: string): string {
  // Clean the app name and get proper initials
  const cleanName = appName.replace(/[^a-zA-Z\s]/g, '').trim();
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);

  let initials: string;
  if (words.length === 0) {
    // Fallback if no valid words
    initials = appName.charAt(0).toUpperCase() || 'A';
  } else if (words.length === 1) {
    // Single word - take first two characters
    initials = words[0]!.substring(0, 2).toUpperCase();
  } else {
    // Multiple words - take first character of first two words
    initials = words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
  }

  // Ensure we have at least one character
  if (initials.length === 0) {
    initials = 'A';
  }

  // Generate a consistent color based on app name
  const colors = [
    '3B82F6', '10B981', 'F59E0B', 'EF4444', '8B5CF6',
    '06B6D4', 'F97316', 'EC4899', '84CC16', '6366F1'
  ];

  const colorIndex = appName.length % colors.length;
  const backgroundColor = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=fff&size=64&font-size=0.6&bold=true`;
}

/**
 * Get alternative icon sources to try before falling back to letter avatars
 */
export function getAlternativeIconSources(appName: string, slug?: string): string[] {
  const cleanSlug = slug || appName.toLowerCase().replace(/[^a-z0-9]/g, '');

  return [
    `https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/${cleanSlug}.png`,
    `https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/${cleanSlug}.svg`,
    `https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/icons/${cleanSlug}.png`,
    `https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/icons/${cleanSlug}.svg`,
    `https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/${cleanSlug}.jpeg`,
    `https://cdn.jsdelivr.net/gh/ComposioHQ/open-logos@master/${cleanSlug}.webp`
  ];
}

/**
 * Get optimized logo URL with fallbacks
 */
export function getOptimizedLogoUrl(app: RealMarketplaceApp): string {
  // Priority order:
  // 1. Composio logo API (highest quality)
  // 2. Open logos CDN (good quality)
  // 3. External URLs (variable quality)
  // 4. Try Composio API with slug
  // 5. Generated fallback (consistent quality)

  if (app.logo) {
    if (app.logo.includes('logos.composio.dev/api/')) {
      // Composio logo API - already optimized, no need for size param
      return app.logo;
    } else if (app.logo.includes('cdn.jsdelivr.net/gh/ComposioHQ/open-logos')) {
      // Open logos CDN - already optimized
      return app.logo;
    } else {
      // External URL - use as-is but validate it's not broken
      return app.logo;
    }
  }

  // Try Composio logo API with slug if available
  if (app.slug) {
    return `https://logos.composio.dev/api/${app.slug}`;
  }

  // Try alternative logo sources before generating
  if (app.name) {
    const cleanSlug = app.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanSlug && cleanSlug !== app.slug) {
      return `https://logos.composio.dev/api/${cleanSlug}`;
    }
  }

  // Final fallback to generated icon
  return generateAppIcon(app.name);
}

/**
 * Check if logo URL is high quality
 */
export function isHighQualityLogo(logoUrl?: string): boolean {
  if (!logoUrl) return false;

  return (
    logoUrl.includes('logos.composio.dev/api/') ||
    logoUrl.includes('cdn.jsdelivr.net/gh/ComposioHQ/open-logos') ||
    logoUrl.includes('.svg') ||
    logoUrl.includes('.png') && !logoUrl.includes('favicon')
  );
}

/**
 * Get logo quality indicator
 */
export function getLogoQuality(logoUrl?: string): 'high' | 'medium' | 'low' | 'generated' {
  if (!logoUrl) return 'generated';

  if (logoUrl.includes('ui-avatars.com')) return 'generated';
  if (logoUrl.includes('logos.composio.dev/api/')) return 'high';
  if (logoUrl.includes('cdn.jsdelivr.net/gh/ComposioHQ/open-logos')) return 'high';
  if (logoUrl.includes('.svg')) return 'high';
  if (logoUrl.includes('favicon.ico')) return 'low';
  if (logoUrl.includes('.png') || logoUrl.includes('.jpg') || logoUrl.includes('.jpeg')) return 'medium';

  return 'medium';
}

/**
 * Format tool count for display
 */
export function formatToolCount(count: number): string {
  if (count === 0) return 'No tools';
  if (count === 1) return '1 tool';
  if (count < 1000) return `${count} tools`;
  return `${(count / 1000).toFixed(1)}k tools`;
}

/**
 * Format category for display
 */
export function formatCategory(category: string): string {
  const mapping = mapPartnerCategory(category);
  return mapping.displayName;
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  const mapping = mapPartnerCategory(category);
  return mapping.displayName;
}

// Removed duplicate functions - using the ones below

/**
 * Generate app URL for navigation
 */
export function generateAppUrl(slug: string): string {
  return `/marketplace/apps/${slug}`;
}

/**
 * Search ranking algorithm for apps
 */
export function rankSearchResults(apps: RealMarketplaceApp[], query: string): RealMarketplaceApp[] {
  if (!query.trim()) return apps;

  const searchTerm = query.toLowerCase();
  
  return apps
    .map(app => ({
      app,
      score: calculateSearchScore(app, searchTerm),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ app }) => app);
}

/**
 * Calculate search relevance score
 */
function calculateSearchScore(app: RealMarketplaceApp, searchTerm: string): number {
  let score = 0;
  
  // Exact name match gets highest score
  if (app.name.toLowerCase() === searchTerm) {
    score += 100;
  }
  
  // Name starts with search term
  if (app.name.toLowerCase().startsWith(searchTerm)) {
    score += 50;
  }
  
  // Name contains search term
  if (app.name.toLowerCase().includes(searchTerm)) {
    score += 25;
  }
  
  // Description contains search term
  if (app.description.toLowerCase().includes(searchTerm)) {
    score += 10;
  }
  
  // Category matches
  if (app.category.some(cat => cat.toLowerCase().includes(searchTerm))) {
    score += 15;
  }
  
  // Tags match
  if (app.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
    score += 8;
  }
  
  // Boost popular apps
  if (app.popularity_score && app.popularity_score > 0) {
    score += Math.min(app.popularity_score / 10, 5);
  }
  
  // Boost highly rated apps
  if (app.rating && app.rating > 4) {
    score += 3;
  }
  
  return score;
}

/**
 * Check if app matches category filter
 */
export function matchesCategory(app: RealMarketplaceApp, categoryFilter: string): boolean {
  if (!categoryFilter || categoryFilter === 'all') return true;
  
  return app.category.some(cat => 
    cat.toLowerCase() === categoryFilter.toLowerCase()
  );
}

/**
 * Validate app data structure
 */
export function validateAppData(app: any): app is RealMarketplaceApp {
  return (
    typeof app === 'object' &&
    typeof app.slug === 'string' &&
    typeof app.name === 'string' &&
    typeof app.description === 'string' &&
    Array.isArray(app.category) &&
    typeof app.requires_auth === 'boolean'
  );
}

/**
 * Get app installation status display text
 */
export function getInstallationStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'Connected';
    case 'inactive':
      return 'Installed';
    case 'error':
      return 'Connection Error';
    case 'pending':
      return 'Connecting...';
    default:
      return 'Not Installed';
  }
}

/**
 * Get app installation status color
 */
export function getInstallationStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50';
    case 'inactive':
      return 'text-yellow-600 bg-yellow-50';
    case 'error':
      return 'text-red-600 bg-red-50';
    case 'pending':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Extract domain from URL for display
 */
export function extractDomain(url?: string): string | null {
  if (!url) return null;
  
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Generate cache key for marketplace data
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        result[key] = params[key];
      }
      return result;
    }, {} as Record<string, any>);

  const paramString = new URLSearchParams(sortedParams).toString();
  return `${prefix}${paramString ? `:${paramString}` : ''}`;
}

/**
 * Get app freshness indicator based on last update
 */
export function getAppFreshness(updatedAt?: string): 'new' | 'recent' | 'stable' | 'outdated' {
  if (!updatedAt) return 'stable';

  const updateDate = new Date(updatedAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) return 'new';
  if (daysDiff <= 30) return 'recent';
  if (daysDiff <= 180) return 'stable';
  return 'outdated';
}

/**
 * Get app complexity level based on tool and trigger count
 */
export function getAppComplexity(toolCount: number, triggerCount: number = 0): 'simple' | 'moderate' | 'advanced' | 'enterprise' {
  const totalFeatures = toolCount + (triggerCount * 2); // Triggers are weighted more

  if (totalFeatures <= 5) return 'simple';
  if (totalFeatures <= 20) return 'moderate';
  if (totalFeatures <= 50) return 'advanced';
  return 'enterprise';
}

/**
 * Get auth complexity description
 */
export function getAuthComplexityDescription(authSchemes: string[], managedSchemes: string[] = []): string {
  if (!authSchemes || authSchemes.length === 0) {
    return 'No authentication required';
  }

  const managedCount = managedSchemes.length;
  const totalCount = authSchemes.length;

  if (managedCount === totalCount) {
    return 'Fully managed authentication';
  } else if (managedCount > 0) {
    return 'Partially managed authentication';
  } else {
    return 'Manual authentication setup required';
  }
}

/**
 * Format app statistics for display
 */
export function formatAppStats(app: RealMarketplaceApp): {
  toolCount: string;
  complexity: string;
  authStatus: string;
  freshness: string;
} {
  return {
    toolCount: formatToolCount(app.tool_count || 0),
    complexity: getAppComplexity(app.tool_count || 0, 0),
    authStatus: getAuthComplexityDescription(app.auth_schemes || []),
    freshness: getAppFreshness(app.updated_at),
  };
}

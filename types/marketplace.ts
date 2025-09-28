export interface RealMarketplaceApp {
  slug: string;
  name: string;
  description: string;
  logo?: string | undefined;
  icon_url?: string | undefined;
  category: string[];
  tool_count?: number | undefined;
  mcp_url?: string | undefined;
  requires_auth: boolean;
  auth_schemes?: string[] | undefined;
  pricing?: 'free' | 'paid' | 'freemium' | undefined;
  tags?: string[] | undefined;
  website_url?: string | undefined;
  documentation_url?: string | undefined;
  support_url?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  popularity_score?: number | undefined;
  rating?: number | undefined;
  review_count?: number | undefined;
}

export interface PartnerApiApp {
  slug: string;
  name: string;
  description: string;
  logo?: string;
  category: string | string[];
  tool_count?: number;
  mcp_url?: string;
  requires_auth?: boolean;
  auth_schemes?: string[];
  pricing?: string;
  tags?: string[];
  website_url?: string;
  documentation_url?: string;
  support_url?: string;
  created_at?: string;
  updated_at?: string;
  popularity_score?: number;
  rating?: number;
  review_count?: number;
}

export interface PartnerApiResponse {
  apps: PartnerApiApp[];
  total?: number;
  page?: number;
  limit?: number;
  success: boolean;
  message?: string;
}

export interface MarketplaceFilters {
  query?: string | undefined;
  category?: string | undefined;
  sort?: 'name' | 'tool_count' | 'category' | 'popularity' | 'rating' | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  pricing?: 'free' | 'paid' | 'freemium' | undefined;
  requires_auth?: boolean | undefined;
  tags?: string[] | undefined;
}

export interface SearchParams {
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
  limit?: string;
  pricing?: string;
  auth?: string;
  tags?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MarketplaceResponse {
  apps: RealMarketplaceApp[];
  pagination: PaginationInfo;
  filters: MarketplaceFilters;
}

export interface ToolkitDetails {
  name: string;
  description: string;
  tools: ComposioTool[];
  auth_schemes: string[];
  setup_instructions?: string;
  documentation_url?: string;
  logo?: string;
  category: string[];
  requires_auth: boolean;
}

export interface ComposioTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  response_schema?: Record<string, any>;
  auth_required: boolean;
  rate_limit?: {
    requests_per_minute?: number;
    requests_per_hour?: number;
  };
}

export interface AppInstallationStatus {
  app_slug: string;
  workspace_id: string;
  is_installed: boolean;
  is_connected: boolean;
  connection_id?: string;
  installed_at?: string;
  last_used?: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  error_message?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  app_count: number;
  popular_apps: string[];
}

export interface SearchSuggestion {
  type: 'app' | 'category' | 'tag';
  value: string;
  label: string;
  count?: number;
}

// Utility types
export type AppSortOption = 'name' | 'tool_count' | 'category' | 'popularity' | 'rating';
export type AppViewMode = 'grid' | 'list';
export type PricingFilter = 'all' | 'free' | 'paid' | 'freemium';
export type AuthFilter = 'all' | 'no_auth' | 'auth_required';

// Legacy compatibility - mark as deprecated
/** @deprecated Use RealMarketplaceApp instead */
export interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  stars: number;
  views: number;
  isConnected: boolean;
  requiresAuth: boolean;
  tags: string[];
}

import { RealMarketplaceApp, MarketplaceFilters, ToolkitDetails } from '@/types/marketplace';
import { normalizePartnerApp } from '@/lib/utils/marketplace-helpers';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ComposioMarketplaceService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly baseUrl: string;
  private readonly cacheTtl: number;

  constructor(config?: { baseUrl?: string; cacheTtl?: number }) {
    // Use MCP Partner API for listing apps (public access)
    this.baseUrl = config?.baseUrl || 'https://mcp.composio.dev/api';
    this.cacheTtl = config?.cacheTtl || 3600; // 1 hour default
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? new URLSearchParams(params).toString() : '';
    return `${endpoint}${paramString ? `?${paramString}` : ''}`;
  }

  private isValidCache<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl * 1000;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.cacheTtl
    });
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || !this.isValidCache(entry)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  async fetchAppsList(): Promise<RealMarketplaceApp[]> {
    const cacheKey = this.getCacheKey('/apps/list');
    const cached = this.getCache<RealMarketplaceApp[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/apps/list`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Composio-Marketplace/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Partner API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();

      // Handle the actual API response structure: { items: [...] }
      let apps: any[] = [];
      if (data.items && Array.isArray(data.items)) {
        apps = data.items;
      } else if (Array.isArray(data)) {
        apps = data;
      } else {
        console.warn('Unexpected Partner API response format:', data);
        apps = [];
      }

      const normalizedApps = apps.map(normalizePartnerApp);

      this.setCache(cacheKey, normalizedApps);
      return normalizedApps;
    } catch (error) {
      console.error('Failed to fetch apps from Partner API:', error);
      throw new Error('Failed to fetch marketplace apps');
    }
  }

  async searchApps(query: string, apps?: RealMarketplaceApp[]): Promise<RealMarketplaceApp[]> {
    const allApps = apps || await this.fetchAppsList();
    
    if (!query.trim()) {
      return allApps;
    }

    const searchTerm = query.toLowerCase();
    return allApps.filter(app => 
      app.name.toLowerCase().includes(searchTerm) ||
      app.description.toLowerCase().includes(searchTerm) ||
      app.category.some(cat => cat.toLowerCase().includes(searchTerm))
    );
  }

  async filterByCategory(category: string, apps?: RealMarketplaceApp[]): Promise<RealMarketplaceApp[]> {
    const allApps = apps || await this.fetchAppsList();
    
    if (!category || category === 'all') {
      return allApps;
    }

    return allApps.filter(app => 
      app.category.some(cat => cat.toLowerCase() === category.toLowerCase())
    );
  }

  async getApps(filters: MarketplaceFilters): Promise<{
    apps: RealMarketplaceApp[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let apps = await this.fetchAppsList();

    // Apply search filter
    if (filters.query) {
      apps = await this.searchApps(filters.query, apps);
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      apps = await this.filterByCategory(filters.category, apps);
    }

    // Apply sorting
    if (filters.sort) {
      apps = this.sortApps(apps, filters.sort);
    }

    const total = apps.length;
    const page = filters.page || 1;
    const limit = filters.limit || 24; // Default page size
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedApps = apps.slice(startIndex, startIndex + limit);

    return {
      apps: paginatedApps,
      total,
      page,
      totalPages
    };
  }

  private sortApps(apps: RealMarketplaceApp[], sortBy: string): RealMarketplaceApp[] {
    const sortedApps = [...apps];
    
    switch (sortBy) {
      case 'name':
        return sortedApps.sort((a, b) => a.name.localeCompare(b.name));
      case 'tool_count':
        return sortedApps.sort((a, b) => (b.tool_count || 0) - (a.tool_count || 0));
      case 'category':
        return sortedApps.sort((a, b) => a.category[0]?.localeCompare(b.category[0] || '') || 0);
      default:
        return sortedApps;
    }
  }

  async getAppDetails(slug: string): Promise<RealMarketplaceApp | null> {
    const apps = await this.fetchAppsList();
    return apps.find(app => app.slug === slug) || null;
  }

  async getToolkitDetails(toolkitName: string): Promise<ToolkitDetails | null> {
    const cacheKey = this.getCacheKey(`/toolkit/${toolkitName}`);
    const cached = this.getCache<ToolkitDetails>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // This would call the actual Composio toolkit API
      // For now, return null as the endpoint structure needs to be confirmed
      return null;
    } catch (error) {
      console.error(`Failed to fetch toolkit details for ${toolkitName}:`, error);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export { ComposioMarketplaceService };
export const composioMarketplaceService = new ComposioMarketplaceService();

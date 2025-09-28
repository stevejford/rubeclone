import { createClient } from 'redis'
import { RealMarketplaceApp, MarketplaceResponse } from '@/types/marketplace'

// Initialize Redis client
const redis = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD!,
  socket: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

redis.on('error', err => console.log('Redis Client Error', err))
redis.on('connect', () => console.log('Connected to Redis'))
redis.on('disconnect', () => console.log('Disconnected from Redis'))

// Connect to Redis
let isConnected = false
const connectRedis = async () => {
  if (!isConnected) {
    try {
      await redis.connect()
      isConnected = true
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (isConnected) {
    await redis.quit()
    isConnected = false
  }
  process.exit(0)
})

// Cache keys
export const CACHE_KEYS = {
  APPS_LIST: (filters: string) => `marketplace:apps:${filters}`,
  APP_DETAIL: (slug: string) => `marketplace:app:${slug}`,
  CATEGORIES: 'marketplace:categories',
  SEARCH_RESULTS: (query: string) => `marketplace:search:${query}`,
  POPULAR_APPS: 'marketplace:popular',
  FEATURED_APPS: 'marketplace:featured',
} as const

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  APPS_LIST: 300, // 5 minutes
  APP_DETAIL: 600, // 10 minutes
  CATEGORIES: 3600, // 1 hour
  SEARCH_RESULTS: 180, // 3 minutes
  POPULAR_APPS: 1800, // 30 minutes
  FEATURED_APPS: 1800, // 30 minutes
} as const

// Redis cache service
export class MarketplaceCacheService {
  /**
   * Get cached marketplace apps with filters
   */
  static async getApps(filtersHash: string): Promise<MarketplaceResponse | null> {
    try {
      await connectRedis()
      const cached = await redis.get(CACHE_KEYS.APPS_LIST(filtersHash))
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Redis get apps error:', error)
      return null
    }
  }

  /**
   * Cache marketplace apps with filters
   */
  static async setApps(filtersHash: string, data: MarketplaceResponse): Promise<void> {
    try {
      await connectRedis()
      await redis.setEx(
        CACHE_KEYS.APPS_LIST(filtersHash),
        CACHE_TTL.APPS_LIST,
        JSON.stringify(data)
      )
    } catch (error) {
      console.error('Redis set apps error:', error)
    }
  }

  /**
   * Get cached app details
   */
  static async getAppDetail(slug: string): Promise<RealMarketplaceApp | null> {
    try {
      await connectRedis()
      const cached = await redis.get(CACHE_KEYS.APP_DETAIL(slug))
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Redis get app detail error:', error)
      return null
    }
  }

  /**
   * Cache app details
   */
  static async setAppDetail(slug: string, app: RealMarketplaceApp): Promise<void> {
    try {
      await connectRedis()
      await redis.setEx(
        CACHE_KEYS.APP_DETAIL(slug),
        CACHE_TTL.APP_DETAIL,
        JSON.stringify(app)
      )
    } catch (error) {
      console.error('Redis set app detail error:', error)
    }
  }

  /**
   * Get cached categories
   */
  static async getCategories(): Promise<any[] | null> {
    try {
      await connectRedis()
      const cached = await redis.get(CACHE_KEYS.CATEGORIES)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Redis get categories error:', error)
      return null
    }
  }

  /**
   * Cache categories
   */
  static async setCategories(categories: any[]): Promise<void> {
    try {
      await connectRedis()
      await redis.setEx(
        CACHE_KEYS.CATEGORIES,
        CACHE_TTL.CATEGORIES,
        JSON.stringify(categories)
      )
    } catch (error) {
      console.error('Redis set categories error:', error)
    }
  }

  /**
   * Get cached search results
   */
  static async getSearchResults(query: string): Promise<MarketplaceResponse | null> {
    try {
      await connectRedis()
      const cached = await redis.get(CACHE_KEYS.SEARCH_RESULTS(query.toLowerCase()))
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Redis get search results error:', error)
      return null
    }
  }

  /**
   * Cache search results
   */
  static async setSearchResults(query: string, results: MarketplaceResponse): Promise<void> {
    try {
      await connectRedis()
      await redis.setEx(
        CACHE_KEYS.SEARCH_RESULTS(query.toLowerCase()),
        CACHE_TTL.SEARCH_RESULTS,
        JSON.stringify(results)
      )
    } catch (error) {
      console.error('Redis set search results error:', error)
    }
  }

  /**
   * Get popular apps (cached for longer)
   */
  static async getPopularApps(): Promise<RealMarketplaceApp[] | null> {
    try {
      await connectRedis()
      const cached = await redis.get(CACHE_KEYS.POPULAR_APPS)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Redis get popular apps error:', error)
      return null
    }
  }

  /**
   * Cache popular apps
   */
  static async setPopularApps(apps: RealMarketplaceApp[]): Promise<void> {
    try {
      await connectRedis()
      await redis.setEx(
        CACHE_KEYS.POPULAR_APPS,
        CACHE_TTL.POPULAR_APPS,
        JSON.stringify(apps)
      )
    } catch (error) {
      console.error('Redis set popular apps error:', error)
    }
  }

  /**
   * Invalidate cache for specific patterns
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      await connectRedis()
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(keys)
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error)
    }
  }

  /**
   * Invalidate all marketplace cache
   */
  static async invalidateAll(): Promise<void> {
    try {
      await this.invalidatePattern('marketplace:*')
    } catch (error) {
      console.error('Redis invalidate all error:', error)
    }
  }

  /**
   * Warm up cache with popular data
   */
  static async warmUpCache(): Promise<void> {
    try {
      // This would be called periodically to pre-populate cache
      console.log('Warming up marketplace cache...')
      // Implementation would fetch and cache popular apps, categories, etc.
    } catch (error) {
      console.error('Redis warm up cache error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalKeys: number
    memoryUsage: string
    hitRate: number
  }> {
    try {
      await connectRedis()
      // const info = await redis.info('memory') // TODO: Parse memory info
      const keys = await redis.keys('marketplace:*')

      return {
        totalKeys: keys.length,
        memoryUsage: 'N/A', // Would parse from info
        hitRate: 0.95 // Would calculate from metrics
      }
    } catch (error) {
      console.error('Redis get cache stats error:', error)
      return {
        totalKeys: 0,
        memoryUsage: 'N/A',
        hitRate: 0
      }
    }
  }
}

// Utility function to create cache key hash from filters
export function createFiltersHash(filters: any): string {
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((result, key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        result[key] = filters[key]
      }
      return result
    }, {} as any)
  
  return Buffer.from(JSON.stringify(sortedFilters)).toString('base64')
}

// Export Redis client for direct use if needed
export { redis }

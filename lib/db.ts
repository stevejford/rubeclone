import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { getEnv } from './env'
import * as schema from './db/schema'

// Create a connection to Neon PostgreSQL
const sql = neon(getEnv().DATABASE_URL)

// Create Drizzle database instance
export const db = drizzle(sql, { schema })

// Export schema for use in other files
export { schema }

/**
 * Database utility functions
 */
export const dbUtils = {
  /**
   * Check database connection health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await sql`SELECT 1 as health`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  },

  /**
   * Get database version and connection info
   */
  async getInfo(): Promise<{
    version: string
    database: string
    user: string
  }> {
    try {
      const [versionResult] = await sql`SELECT version() as version`
      const [dbResult] = await sql`SELECT current_database() as database, current_user as user`

      return {
        version: versionResult?.version || 'Unknown',
        database: dbResult?.database || 'Unknown',
        user: dbResult?.user || 'Unknown'
      }
    } catch (error) {
      console.error('Failed to get database info:', error)
      throw new Error('Failed to retrieve database information')
    }
  }
}

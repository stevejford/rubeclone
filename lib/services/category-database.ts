// Using Neon MCP for database operations

interface CategoryData {
  id?: number;
  name: string;
  displayName: string;
  description?: string;
  appCount: number;
  iconName?: string;
  colorClass?: string;
  isActive?: boolean;
  lastSyncedAt?: Date;
}

interface AppData {
  id?: number;
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  toolCount: number;
  requiresAuth: boolean;
  pricing: 'free' | 'paid' | 'freemium';
  websiteUrl?: string;
  popularityScore?: number;
  isActive?: boolean;
}

class CategoryDatabaseService {
  private pool: any;

  constructor() {
    // Initialize the pool (will be created when needed)
    this.pool = null;
  }

  private async getPool() {
    if (!this.pool) {
      const { Pool } = await import('pg');
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
    }
    return this.pool;
  }

  async initializeDatabase(): Promise<void> {
    // Database schema is already created via Neon MCP
    console.log('Database schema already initialized via Neon MCP');
  }

  async syncCategories(categories: CategoryData[]): Promise<void> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const category of categories) {
        await client.query(`
          INSERT INTO marketplace_categories (name, display_name, description, app_count, last_synced_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (name) 
          DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            description = EXCLUDED.description,
            app_count = EXCLUDED.app_count,
            last_synced_at = NOW(),
            updated_at = NOW()
        `, [
          category.name,
          category.displayName,
          category.description || `${category.displayName} tools and services`,
          category.appCount
        ]);
      }

      await client.query('COMMIT');
      console.log(`Synced ${categories.length} categories to database`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to sync categories:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async syncApps(apps: AppData[]): Promise<void> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const app of apps) {
        await client.query(`
          INSERT INTO marketplace_apps (
            slug, name, description, logo_url, tool_count, 
            requires_auth, pricing, website_url, popularity_score, last_synced_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (slug) 
          DO UPDATE SET 
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            logo_url = EXCLUDED.logo_url,
            tool_count = EXCLUDED.tool_count,
            requires_auth = EXCLUDED.requires_auth,
            pricing = EXCLUDED.pricing,
            website_url = EXCLUDED.website_url,
            popularity_score = EXCLUDED.popularity_score,
            last_synced_at = NOW(),
            updated_at = NOW()
        `, [
          app.slug,
          app.name,
          app.description,
          app.logoUrl,
          app.toolCount,
          app.requiresAuth,
          app.pricing,
          app.websiteUrl,
          app.popularityScore || 0
        ]);
      }

      await client.query('COMMIT');
      console.log(`Synced ${apps.length} apps to database`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to sync apps:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async syncAppCategories(appSlug: string, categoryNames: string[]): Promise<void> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get app ID
      const appResult = await client.query('SELECT id FROM marketplace_apps WHERE slug = $1', [appSlug]);
      if (appResult.rows.length === 0) {
        throw new Error(`App not found: ${appSlug}`);
      }
      const appId = appResult.rows[0].id;

      // Clear existing categories for this app
      await client.query('DELETE FROM app_categories WHERE app_id = $1', [appId]);

      // Add new categories
      for (const categoryName of categoryNames) {
        const categoryResult = await client.query(
          'SELECT id FROM marketplace_categories WHERE name = $1', 
          [categoryName.toLowerCase().trim()]
        );
        
        if (categoryResult.rows.length > 0) {
          const categoryId = categoryResult.rows[0].id;
          await client.query(
            'INSERT INTO app_categories (app_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [appId, categoryId]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Failed to sync app categories for ${appSlug}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getCategories(): Promise<CategoryData[]> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id, name, display_name, description, app_count, 
          icon_name, color_class, is_active, last_synced_at
        FROM marketplace_categories 
        WHERE is_active = true 
        ORDER BY app_count DESC, display_name ASC
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        description: row.description,
        appCount: row.app_count,
        iconName: row.icon_name,
        colorClass: row.color_class,
        isActive: row.is_active,
        lastSyncedAt: row.last_synced_at
      }));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getCategoryStats(): Promise<{
    totalCategories: number;
    totalApps: number;
    lastSyncedAt: Date | null;
    topCategories: Array<{ name: string; appCount: number }>;
  }> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      const [categoriesResult, appsResult, topCategoriesResult] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM marketplace_categories WHERE is_active = true'),
        client.query('SELECT COUNT(*) as count FROM marketplace_apps WHERE is_active = true'),
        client.query(`
          SELECT display_name as name, app_count 
          FROM marketplace_categories 
          WHERE is_active = true 
          ORDER BY app_count DESC 
          LIMIT 5
        `)
      ]);

      const lastSyncResult = await client.query(
        'SELECT MAX(last_synced_at) as last_synced FROM marketplace_categories'
      );

      return {
        totalCategories: parseInt(categoriesResult.rows[0].count),
        totalApps: parseInt(appsResult.rows[0].count),
        lastSyncedAt: lastSyncResult.rows[0].last_synced,
        topCategories: topCategoriesResult.rows.map((row: any) => ({
          name: row.name,
          appCount: row.app_count
        }))
      };
    } catch (error) {
      console.error('Failed to fetch category stats:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export { CategoryDatabaseService, type CategoryData, type AppData };

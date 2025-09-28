import { NextResponse } from 'next/server';
import { ComposioMarketplaceService } from '@/lib/services/composio-marketplace';

// const PROJECT_ID = 'silent-sea-02092943'; // AI Tool Marketplace project

// Helper function to execute SQL via Neon (server-side only)
async function executeSQL(sql: string): Promise<any[]> {
  // This would need to be implemented with a server-side Neon client
  // For now, we'll use a simple approach
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(sql);
    return result.rows;
  } finally {
    await pool.end();
  }
}

// This endpoint will sync categories from Composio API and store them in database
export async function POST() {
  try {
    // Get all apps from Composio API
    const marketplaceService = new ComposioMarketplaceService();
    const apps = await marketplaceService.fetchAppsList();
    
    // Extract unique categories with counts
    const categoryMap = new Map<string, {
      name: string;
      displayName: string;
      appCount: number;
      apps: string[];
      lastUpdated: string;
    }>();
    
    apps.forEach(app => {
      const categories = Array.isArray(app.category) ? app.category : [app.category].filter(Boolean);
      
      categories.forEach(cat => {
        if (!cat) return;
        
        const key = cat.toLowerCase().trim();
        const existing = categoryMap.get(key);
        
        if (existing) {
          existing.appCount++;
          existing.apps.push(app.slug);
        } else {
          categoryMap.set(key, {
            name: key,
            displayName: cat.charAt(0).toUpperCase() + cat.slice(1),
            appCount: 1,
            apps: [app.slug],
            lastUpdated: new Date().toISOString()
          });
        }
      });
    });
    
    // Convert to array and sort by app count
    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.appCount - a.appCount);
    
    // Store categories in Neon database
    for (const category of categories) {
      await executeSQL(`
        INSERT INTO marketplace_categories (name, display_name, description, app_count, last_synced_at)
        VALUES ('${category.name}', '${category.displayName}', '${category.displayName} tools and services (${category.appCount} apps)', ${category.appCount}, NOW())
        ON CONFLICT (name)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          app_count = EXCLUDED.app_count,
          last_synced_at = NOW(),
          updated_at = NOW()
      `);
    }

    // Store apps in database
    for (const app of apps) {
      await executeSQL(`
        INSERT INTO marketplace_apps (
          slug, name, description, logo_url, tool_count,
          requires_auth, pricing, website_url, last_synced_at
        )
        VALUES (
          '${app.slug}',
          '${app.name.replace(/'/g, "''")}',
          '${(app.description || '').replace(/'/g, "''")}',
          '${app.logo || ''}',
          ${app.tool_count},
          ${app.requires_auth},
          '${app.pricing}',
          '${app.website_url || ''}',
          NOW()
        )
        ON CONFLICT (slug)
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          logo_url = EXCLUDED.logo_url,
          tool_count = EXCLUDED.tool_count,
          requires_auth = EXCLUDED.requires_auth,
          pricing = EXCLUDED.pricing,
          website_url = EXCLUDED.website_url,
          last_synced_at = NOW(),
          updated_at = NOW()
      `);
    }

    // Sync app-category relationships
    for (const app of apps) {
      const appCategories = Array.isArray(app.category) ? app.category : [app.category].filter(Boolean);
      if (appCategories.length > 0) {
        // Get app ID
        const appRows = await executeSQL(`SELECT id FROM marketplace_apps WHERE slug = '${app.slug}'`);
        if (appRows.length > 0) {
          const appId = appRows[0].id;

          // Clear existing categories for this app
          await executeSQL(`DELETE FROM app_categories WHERE app_id = ${appId}`);

          // Add new categories
          for (const categoryName of appCategories) {
            const catKey = categoryName.toLowerCase().trim();
            const categoryRows = await executeSQL(`SELECT id FROM marketplace_categories WHERE name = '${catKey}'`);

            if (categoryRows.length > 0) {
              const categoryId = categoryRows[0].id;
              await executeSQL(`
                INSERT INTO app_categories (app_id, category_id)
                VALUES (${appId}, ${categoryId})
                ON CONFLICT DO NOTHING
              `);
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Synced ${categories.length} categories from ${apps.length} apps`,
      categories: categories.map(cat => ({
        name: cat.name,
        displayName: cat.displayName,
        appCount: cat.appCount,
        lastUpdated: cat.lastUpdated
      })),
      stats: {
        totalApps: apps.length,
        totalCategories: categories.length,
        avgAppsPerCategory: Math.round(apps.length / categories.length),
        topCategories: categories.slice(0, 5).map(c => `${c.displayName} (${c.appCount})`)
      }
    });
    
  } catch (error) {
    console.error('Category sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current categories from database
export async function GET() {
  try {
    const categories = await executeSQL(`
      SELECT
        id, name, display_name, description, app_count,
        icon_name, color_class, is_active, last_synced_at
      FROM marketplace_categories
      WHERE is_active = true
      ORDER BY app_count DESC, display_name ASC
    `);

    const [totalCategoriesResult, totalAppsResult] = await Promise.all([
      executeSQL('SELECT COUNT(*) as count FROM marketplace_categories WHERE is_active = true'),
      executeSQL('SELECT COUNT(*) as count FROM marketplace_apps WHERE is_active = true')
    ]);

    const stats = {
      totalCategories: parseInt(totalCategoriesResult[0]?.count || '0'),
      totalApps: parseInt(totalAppsResult[0]?.count || '0'),
      lastSyncedAt: categories[0]?.last_synced_at || null,
      topCategories: categories.slice(0, 5).map(cat => ({
        name: cat.display_name,
        appCount: cat.app_count
      }))
    };

    return NextResponse.json({
      success: true,
      categories: categories.map(cat => ({
        partnerKey: cat.name,
        displayName: cat.display_name,
        description: cat.description,
        appCount: cat.app_count,
        iconName: cat.icon_name || 'Settings',
        colorClass: cat.color_class || 'bg-gray-400'
      })),
      stats,
      message: `Retrieved ${categories.length} categories from database`
    });

  } catch (error) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories from database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

// Helper function to execute SQL via Neon
async function executeSQL(sql: string): Promise<any[]> {
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

// GET endpoint for frontend to fetch categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');
    const minApps = searchParams.get('minApps') || '5'; // Only show categories with 5+ apps by default

    let sql = `
      SELECT
        id, name, display_name, description, app_count,
        icon_name, color_class, is_active, last_synced_at
      FROM marketplace_categories
      WHERE is_active = true AND app_count >= $1
    `;

    const params: any[] = [parseInt(minApps)];

    // Add search filter if provided
    if (search) {
      sql += ` AND (display_name ILIKE $${params.length + 1} OR name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY app_count DESC, display_name ASC`;

    // Add limit if provided
    if (limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    let categories;
    try {
      const result = await pool.query(sql, params);
      categories = result.rows;
    } finally {
      await pool.end();
    }

    // Convert database categories to CategoryMapping format for frontend
    const mappedCategories = categories.map(cat => {
      // Better category mapping based on keywords
      const getCategoryMapping = (name: string) => {
        const lowerName = name.toLowerCase();

        // Map based on keywords in category name
        if (lowerName.includes('communication') || lowerName.includes('email') || lowerName.includes('messaging')) {
          return { iconName: 'MessageSquare', color: 'bg-blue-500' };
        }
        if (lowerName.includes('productivity') || lowerName.includes('project')) {
          return { iconName: 'Calendar', color: 'bg-green-500' };
        }
        if (lowerName.includes('design') || lowerName.includes('creative')) {
          return { iconName: 'Camera', color: 'bg-teal-500' };
        }
        if (lowerName.includes('crm') || lowerName.includes('customer')) {
          return { iconName: 'Users', color: 'bg-orange-500' };
        }
        if (lowerName.includes('analytics') || lowerName.includes('data')) {
          return { iconName: 'BarChart3', color: 'bg-red-500' };
        }
        if (lowerName.includes('marketing') || lowerName.includes('social')) {
          return { iconName: 'Mail', color: 'bg-pink-500' };
        }
        if (lowerName.includes('finance') || lowerName.includes('accounting')) {
          return { iconName: 'DollarSign', color: 'bg-green-700' };
        }
        if (lowerName.includes('api') || lowerName.includes('development')) {
          return { iconName: 'Code', color: 'bg-indigo-500' };
        }
        if (lowerName.includes('security')) {
          return { iconName: 'Shield', color: 'bg-gray-600' };
        }
        if (lowerName.includes('automation')) {
          return { iconName: 'Zap', color: 'bg-amber-500' };
        }
        if (lowerName.includes('ecommerce') || lowerName.includes('e-commerce')) {
          return { iconName: 'ShoppingCart', color: 'bg-yellow-500' };
        }

        // Use database values or defaults
        return {
          iconName: cat.icon_name || 'Settings',
          color: cat.color_class || 'bg-gray-400'
        };
      };

      const mapping = getCategoryMapping(cat.name);

      return {
        partnerKey: cat.name,
        displayName: cat.display_name,
        iconName: mapping.iconName,
        description: cat.description || `${cat.display_name} tools and services`,
        color: mapping.color,
        appCount: cat.app_count
      };
    });

    // Get total count for pagination info
    const totalCountResult = await executeSQL(`
      SELECT COUNT(*) as total
      FROM marketplace_categories
      WHERE is_active = true AND app_count >= ${parseInt(minApps)}
    `);
    const totalCount = totalCountResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      categories: mappedCategories,
      total: mappedCategories.length,
      totalAvailable: parseInt(totalCount),
      filtered: !!search || !!limit,
      filters: {
        search: search || null,
        limit: limit ? parseInt(limit) : null,
        minApps: parseInt(minApps)
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch categories:', error);

    // Fallback to static categories if database fails
    const { getAllCategories } = await import('@/lib/constants/categories');
    const fallbackCategories = getAllCategories();

    return NextResponse.json({
      success: true,
      categories: fallbackCategories,
      total: fallbackCategories.length,
      fallback: true,
      error: 'Database unavailable, using static categories',
      lastUpdated: new Date().toISOString()
    });
  }
}

// POST endpoint to trigger category refresh (for admin use)
export async function POST() {
  try {
    // Trigger a background sync by calling the sync endpoint
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const syncResponse = await fetch(`${baseUrl}/api/admin/sync-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!syncResponse.ok) {
      throw new Error(`Sync failed: ${syncResponse.statusText}`);
    }
    
    const syncResult = await syncResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'Category sync triggered successfully',
      syncResult
    });
    
  } catch (error) {
    console.error('Failed to trigger category sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger category sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

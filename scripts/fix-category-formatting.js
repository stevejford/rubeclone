const { Pool } = require('pg');
require('dotenv').config();

// Function to properly format category display names
function formatDisplayName(name) {
  return name
    .split(/[\s_-]+/) // Split on spaces, underscores, or hyphens
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\bApi\b/g, 'API') // Fix API capitalization
    .replace(/\bCrm\b/g, 'CRM') // Fix CRM capitalization
    .replace(/\bUi\b/g, 'UI')   // Fix UI capitalization
    .replace(/\bAi\b/g, 'AI')   // Fix AI capitalization
    .replace(/\bSeo\b/g, 'SEO') // Fix SEO capitalization
    .replace(/\bHr\b/g, 'HR')   // Fix HR capitalization
    .replace(/\bIt\b/g, 'IT');  // Fix IT capitalization
}

async function fixCategoryFormatting() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Fixing category formatting...');
    
    // Get all categories
    const result = await pool.query('SELECT id, name, display_name FROM marketplace_categories');
    
    console.log(`📋 Found ${result.rows.length} categories to update`);
    
    // Update each category
    for (const category of result.rows) {
      const newDisplayName = formatDisplayName(category.name);
      
      if (newDisplayName !== category.display_name) {
        await pool.query(
          'UPDATE marketplace_categories SET display_name = $1, updated_at = NOW() WHERE id = $2',
          [newDisplayName, category.id]
        );
        
        console.log(`✅ Updated: "${category.display_name}" -> "${newDisplayName}"`);
      } else {
        console.log(`⏭️  Skipped: "${category.display_name}" (already formatted)`);
      }
    }
    
    // Show updated results
    console.log('\n📊 Updated categories:');
    const updatedResult = await pool.query(`
      SELECT name, display_name, app_count 
      FROM marketplace_categories 
      ORDER BY app_count DESC 
      LIMIT 10
    `);
    
    updatedResult.rows.forEach(row => {
      console.log(`- ${row.name} -> "${row.display_name}" (${row.app_count} apps)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixCategoryFormatting();

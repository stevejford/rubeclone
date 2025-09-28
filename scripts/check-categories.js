const { Pool } = require('pg');
require('dotenv').config();

async function checkCategories() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(`
      SELECT name, display_name, app_count, icon_name, color_class 
      FROM marketplace_categories 
      ORDER BY app_count DESC 
      LIMIT 15
    `);
    
    console.log('📊 Current database categories:');
    result.rows.forEach(row => {
      console.log(`- ${row.name} -> "${row.display_name}" (${row.app_count} apps) [${row.icon_name}, ${row.color_class}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkCategories();

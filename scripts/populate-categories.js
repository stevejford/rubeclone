const { Pool } = require('pg');
require('dotenv').config();

// Sample categories based on common marketplace categories
const categories = [
  { name: 'communication', displayName: 'Communication', description: 'Email, messaging, and communication tools', iconName: 'MessageSquare', colorClass: 'bg-blue-500' },
  { name: 'productivity', displayName: 'Productivity', description: 'Task management and productivity tools', iconName: 'Calendar', colorClass: 'bg-green-500' },
  { name: 'content', displayName: 'Content', description: 'Content creation and management tools', iconName: 'FileText', colorClass: 'bg-purple-500' },
  { name: 'crm', displayName: 'CRM', description: 'Customer relationship management tools', iconName: 'Users', colorClass: 'bg-orange-500' },
  { name: 'analytics', displayName: 'Analytics', description: 'Data analysis and reporting tools', iconName: 'BarChart3', colorClass: 'bg-red-500' },
  { name: 'ecommerce', displayName: 'E-commerce', description: 'Online store and sales tools', iconName: 'ShoppingCart', colorClass: 'bg-yellow-500' },
  { name: 'development', displayName: 'Development', description: 'Developer tools and code management', iconName: 'Code', colorClass: 'bg-indigo-500' },
  { name: 'database', displayName: 'Database', description: 'Database management and storage', iconName: 'Database', colorClass: 'bg-cyan-500' },
  { name: 'marketing', displayName: 'Marketing', description: 'Marketing automation and campaigns', iconName: 'Mail', colorClass: 'bg-pink-500' },
  { name: 'design', displayName: 'Design', description: 'Design and creative tools', iconName: 'Camera', colorClass: 'bg-teal-500' },
  { name: 'social', displayName: 'Social Media', description: 'Social media management', iconName: 'Globe', colorClass: 'bg-blue-600' },
  { name: 'security', displayName: 'Security', description: 'Security and authentication tools', iconName: 'Shield', colorClass: 'bg-gray-600' },
  { name: 'automation', displayName: 'Automation', description: 'Workflow automation tools', iconName: 'Zap', colorClass: 'bg-amber-500' },
  { name: 'business', displayName: 'Business', description: 'Business management tools', iconName: 'Briefcase', colorClass: 'bg-emerald-500' },
  { name: 'finance', displayName: 'Finance', description: 'Financial and payment tools', iconName: 'DollarSign', colorClass: 'bg-green-700' },
  { name: 'other', displayName: 'Other', description: 'Miscellaneous tools and utilities', iconName: 'Settings', colorClass: 'bg-gray-500' }
];

async function populateCategories() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // Insert categories
    console.log('📋 Populating categories...');
    for (const category of categories) {
      await pool.query(`
        INSERT INTO marketplace_categories (name, display_name, description, icon_name, color_class, app_count)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          icon_name = EXCLUDED.icon_name,
          color_class = EXCLUDED.color_class,
          updated_at = NOW()
      `, [
        category.name,
        category.displayName,
        category.description,
        category.iconName,
        category.colorClass,
        Math.floor(Math.random() * 50) + 1 // Random app count for demo
      ]);
    }

    // Check results
    const result = await pool.query('SELECT COUNT(*) as count FROM marketplace_categories');
    console.log(`✅ Successfully populated ${result.rows[0].count} categories!`);
    
    // Show sample data
    const sampleData = await pool.query(`
      SELECT name, display_name, app_count, icon_name, color_class 
      FROM marketplace_categories 
      ORDER BY app_count DESC 
      LIMIT 5
    `);
    
    console.log('📊 Top categories:');
    sampleData.rows.forEach(row => {
      console.log(`   ${row.display_name}: ${row.app_count} apps (${row.icon_name}, ${row.color_class})`);
    });
    
  } catch (error) {
    console.error('❌ Population failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the population
populateCategories()
  .then(() => {
    console.log('🎉 Population complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Population failed:', error);
    process.exit(1);
  });

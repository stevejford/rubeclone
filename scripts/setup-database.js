const { Pool } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // Create marketplace_categories table
    console.log('📋 Creating marketplace_categories table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(200) NOT NULL,
        description TEXT,
        icon_name VARCHAR(50) NOT NULL DEFAULT 'Settings',
        color_class VARCHAR(20) NOT NULL DEFAULT 'bg-gray-400',
        app_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for marketplace_categories
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_categories_name ON marketplace_categories(name);
      CREATE INDEX IF NOT EXISTS idx_marketplace_categories_active ON marketplace_categories(is_active);
      CREATE INDEX IF NOT EXISTS idx_marketplace_categories_app_count ON marketplace_categories(app_count DESC);
    `);

    // Create marketplace_apps table
    console.log('📱 Creating marketplace_apps table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_apps (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        logo_url TEXT,
        tool_count INTEGER DEFAULT 0,
        requires_auth BOOLEAN DEFAULT false,
        pricing VARCHAR(20) DEFAULT 'free',
        website_url TEXT,
        popularity_score INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for marketplace_apps
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_apps_slug ON marketplace_apps(slug);
      CREATE INDEX IF NOT EXISTS idx_marketplace_apps_active ON marketplace_apps(is_active);
      CREATE INDEX IF NOT EXISTS idx_marketplace_apps_requires_auth ON marketplace_apps(requires_auth);
      CREATE INDEX IF NOT EXISTS idx_marketplace_apps_pricing ON marketplace_apps(pricing);
    `);

    // Create app_categories junction table
    console.log('🔗 Creating app_categories junction table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_categories (
        id SERIAL PRIMARY KEY,
        app_id INTEGER NOT NULL REFERENCES marketplace_apps(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES marketplace_categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(app_id, category_id)
      );
    `);

    // Create indexes for app_categories
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_app_categories_app_id ON app_categories(app_id);
      CREATE INDEX IF NOT EXISTS idx_app_categories_category_id ON app_categories(category_id);
    `);

    console.log('✅ Database setup completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - marketplace_categories');
    console.log('   - marketplace_apps');
    console.log('   - app_categories');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('🎉 Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });

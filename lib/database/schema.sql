-- Categories table to store persistent category data
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE, -- lowercase key (e.g., 'communication')
  display_name VARCHAR(100) NOT NULL, -- formatted name (e.g., 'Communication')
  description TEXT,
  app_count INTEGER DEFAULT 0,
  icon_name VARCHAR(50) DEFAULT 'Settings', -- Lucide icon name
  color_class VARCHAR(50) DEFAULT 'bg-gray-400', -- Tailwind color class
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apps table to store app information
CREATE TABLE IF NOT EXISTS marketplace_apps (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  logo_url TEXT,
  tool_count INTEGER DEFAULT 0,
  requires_auth BOOLEAN DEFAULT false,
  pricing VARCHAR(20) DEFAULT 'free', -- 'free', 'paid', 'freemium'
  website_url TEXT,
  popularity_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for app-category relationships (many-to-many)
CREATE TABLE IF NOT EXISTS app_categories (
  id SERIAL PRIMARY KEY,
  app_id INTEGER REFERENCES marketplace_apps(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES marketplace_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(app_id, category_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_name ON marketplace_categories(name);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_active ON marketplace_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_app_count ON marketplace_categories(app_count DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_apps_slug ON marketplace_apps(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_apps_active ON marketplace_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_apps_requires_auth ON marketplace_apps(requires_auth);
CREATE INDEX IF NOT EXISTS idx_marketplace_apps_pricing ON marketplace_apps(pricing);

CREATE INDEX IF NOT EXISTS idx_app_categories_app_id ON app_categories(app_id);
CREATE INDEX IF NOT EXISTS idx_app_categories_category_id ON app_categories(category_id);

-- Function to update category app counts
CREATE OR REPLACE FUNCTION update_category_app_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update app count for affected categories
  UPDATE marketplace_categories 
  SET app_count = (
    SELECT COUNT(DISTINCT ac.app_id)
    FROM app_categories ac
    JOIN marketplace_apps ma ON ac.app_id = ma.id
    WHERE ac.category_id = marketplace_categories.id 
    AND ma.is_active = true
  ),
  updated_at = NOW()
  WHERE id IN (
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.category_id
      ELSE NEW.category_id
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update category counts
DROP TRIGGER IF EXISTS trigger_update_category_counts ON app_categories;
CREATE TRIGGER trigger_update_category_counts
  AFTER INSERT OR UPDATE OR DELETE ON app_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_app_counts();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_marketplace_categories_updated_at ON marketplace_categories;
CREATE TRIGGER trigger_marketplace_categories_updated_at
  BEFORE UPDATE ON marketplace_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_marketplace_apps_updated_at ON marketplace_apps;
CREATE TRIGGER trigger_marketplace_apps_updated_at
  BEFORE UPDATE ON marketplace_apps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

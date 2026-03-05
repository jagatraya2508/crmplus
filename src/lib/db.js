import { Pool } from 'pg';

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'crmplus',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result;
}

export async function getOne(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

export async function getMany(text, params) {
  const result = await query(text, params);
  return result.rows;
}

export async function initDatabase() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'sales' CHECK (role IN ('admin', 'manager', 'sales')),
      phone VARCHAR(50),
      avatar VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(100),
      address TEXT,
      city VARCHAR(100),
      province VARCHAR(100),
      postal_code VARCHAR(20),
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      category VARCHAR(50) DEFAULT 'prospect' CHECK (category IN ('prospect', 'active', 'inactive', 'vip')),
      notes TEXT,
      assigned_to INTEGER REFERENCES users(id),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(100),
      phone VARCHAR(100),
      email VARCHAR(255),
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      product_code VARCHAR(100) UNIQUE,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) UNIQUE,
      description TEXT,
      price DECIMAL(15,2) DEFAULT 0,
      unit VARCHAR(50) DEFAULT 'pcs',
      category VARCHAR(100),
      stock INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(100) UNIQUE;

    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(20) DEFAULT '#3b82f6',
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      customer_id INTEGER REFERENCES customers(id),
      stage_id INTEGER REFERENCES pipeline_stages(id),
      value DECIMAL(15,2) DEFAULT 0,
      probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
      expected_close DATE,
      assigned_to INTEGER REFERENCES users(id),
      description TEXT,
      status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL CHECK (type IN ('call', 'meeting', 'email', 'note', 'task', 'visit')),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      customer_id INTEGER REFERENCES customers(id),
      opportunity_id INTEGER REFERENCES opportunities(id),
      user_id INTEGER REFERENCES users(id),
      scheduled_at TIMESTAMP,
      completed_at TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      user_id INTEGER REFERENCES users(id),
      checkin_time TIMESTAMP NOT NULL DEFAULT NOW(),
      checkout_time TIMESTAMP,
      checkin_lat DOUBLE PRECISION,
      checkin_lng DOUBLE PRECISION,
      checkout_lat DOUBLE PRECISION,
      checkout_lng DOUBLE PRECISION,
      checkin_address TEXT,
      checkout_address TEXT,
      checkin_photo VARCHAR(500),
      notes TEXT,
      summary TEXT,
      status VARCHAR(50) DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id),
      user_id INTEGER REFERENCES users(id),
      status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'processing', 'shipped', 'completed', 'cancelled')),
      subtotal DECIMAL(15,2) DEFAULT 0,
      discount DECIMAL(15,2) DEFAULT 0,
      tax DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2) DEFAULT 0,
      notes TEXT,
      approved_by INTEGER REFERENCES users(id),
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name VARCHAR(255),
      quantity INTEGER DEFAULT 1,
      price DECIMAL(15,2) DEFAULT 0,
      discount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2) DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) CHECK (type IN ('email', 'social', 'event', 'promotion', 'other')),
      status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
      budget DECIMAL(15,2) DEFAULT 0,
      start_date DATE,
      end_date DATE,
      description TEXT,
      target_audience TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(100),
      company VARCHAR(255),
      source VARCHAR(100) CHECK (source IN ('website', 'referral', 'social_media', 'campaign', 'cold_call', 'event', 'other')),
      score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
      status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
      campaign_id INTEGER REFERENCES campaigns(id),
      assigned_to INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_locations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      accuracy DOUBLE PRECISION,
      speed DOUBLE PRECISION,
      heading DOUBLE PRECISION,
      recorded_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_locations_recorded_at ON user_locations(recorded_at);

    -- Insert default pipeline stages if not exists
    INSERT INTO pipeline_stages (name, color, sort_order) 
    SELECT * FROM (VALUES 
      ('Prospek Baru', '#6366f1', 1),
      ('Kualifikasi', '#f59e0b', 2),
      ('Proposal', '#3b82f6', 3),
      ('Negosiasi', '#f97316', 4),
      ('Closing', '#10b981', 5)
    ) AS v(name, color, sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages LIMIT 1);
  `);
}

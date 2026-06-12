-- ------------------------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------------------------
-- pgcrypto -> password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- pg_trgm -> advanced, typo-tolerant full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------------------------
-- CLEANUP (DROPPING EXISTING TABLES TO ALLOW RE-RUNNING SCRIPT)
-- ------------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS popular_products;
DROP TABLE IF EXISTS product_similarities CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS store_products CASCADE;

-- ------------------------------------------------------------------------------
-- SCHEMA CREATION
-- ------------------------------------------------------------------------------

-- users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- store_products table
CREATE TABLE IF NOT EXISTS store_products (
    product_id SERIAL PRIMARY KEY,
    product_img TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price NUMERIC(10, 2) NOT NULL,
    product_category VARCHAR(100) NOT NULL,
    product_description TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0
);

-- cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES store_products(product_id) ON DELETE CASCADE,
    item_quantity INTEGER NOT NULL
);

-- product_similarities table for recommendations (0-1 scale)
CREATE TABLE IF NOT EXISTS product_similarities (
    product_id INTEGER REFERENCES store_products(product_id) ON DELETE CASCADE,
    similar_product_id INTEGER REFERENCES store_products(product_id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    PRIMARY KEY (product_id, similar_product_id),
    CHECK (similarity_score >= 0 AND similarity_score <= 1)
);

-- ------------------------------------------------------------------------------
-- VIEWS
-- ------------------------------------------------------------------------------

-- Create materialized view (snapshot) for popular products (to avoid recalculating similarity scores by joining databases for every user, therefore faster reads)
-- materialized view -> for faster reads
-- job queue (Redis + BullMQ) -> for faster writes/mutations (to avoid waiting for the script to run everytime user adds)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_products AS
SELECT 
    sp.product_id as id,
    sp.product_name as name,
    sp.product_category as category,
    sp.product_price as price,
    sp.product_img as image_url,
    COUNT(DISTINCT ps.similar_product_id) as similarity_count
FROM store_products sp
LEFT JOIN product_similarities ps ON sp.product_id = ps.product_id
GROUP BY sp.product_id, sp.product_name, sp.product_category, sp.product_price, sp.product_img
ORDER BY similarity_count DESC;

-- ==================================
-- INDEXES
-- ==================================

-- for fetching a user's entire cart quickly
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Composite index for finding a specific item in a specific user's cart (used for updates/deletes)
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);

-- Create index for faster similarity lookups
CREATE INDEX IF NOT EXISTS idx_product_similarities_product_id ON product_similarities(product_id);

-- concatenated GIN index for search and category filtering
-- covers full-text search across name, description, and category
CREATE INDEX IF NOT EXISTS idx_products_search_trgm 
ON store_products 
USING GIN ((product_name || ' ' || COALESCE(product_description, '') || ' ' || product_category) gin_trgm_ops);

-- ------------------------------------------------------------------------------
-- DATA SEEDING 
-- ------------------------------------------------------------------------------

-- Insert default test employee account + default test user account
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'test@test.com', 
    crypt('123456', gen_salt('bf')), -- Generates a bcrypt-compatible hash
    'Test Employee', 
    'employee'
), 
(
    'nour@example.com', 
    crypt('qwerty12345', gen_salt('bf')), 
    'Test User', 
    'customer'
)
ON CONFLICT (email) DO NOTHING; -- Prevents errors if the script runs twice

-- Insert sample products
INSERT INTO store_products (product_img, product_name, product_price, product_category, product_description, stock_quantity)
VALUES
    ('https://www.goodfruit.com/wp-content/uploads/snowflakeApple.jpg', 'Red Apples', 19.00, 'Fruits', 'Fresh, crisp red apples perfect for snacking or baking', 42),
    ('https://media.istockphoto.com/id/1184345169/photo/banana.jpg?s=612x612&w=0&k=20&c=NdHyi6Jd9y1855Q5mLO2tV_ZRnaJGtZGCSMMT7oxdF4=', 'Bananas', 24.00, 'Fruits', 'Sweet and ripe yellow bananas rich in potassium', 36),
    ('https://st2.depositphotos.com/16122460/42446/i/450/depositphotos_424463870-stock-photo-jug-glass-fresh-milk-white.jpg', 'Milk', 15.50, 'Dairy', 'Fresh whole milk from local dairy farms', 18),
    ('https://verdimed.com/wp-content/uploads/2021/10/product-others-carrots.jpg', 'Carrots', 2.00, 'Vegetables', 'Organic fresh carrots, great for salads and cooking', 54),
    ('https://img.freepik.com/premium-photo/potato-chips-white-background_55883-8452.jpg', 'Chips', 5.50, 'Snacks', 'Crispy potato chips with a perfect salt balance', 27),
    ('https://img.freepik.com/premium-photo/smooth-butter-elegance_996379-9801.jpg', 'Butter', 11.50, 'Dairy', 'Creamy unsalted butter perfect for cooking and baking', 12),
    ('https://img.freepik.com/premium-photo/plain-lettuce-isolated-white-background_434193-7334.jpg', 'Lettuce', 5.00, 'Vegetables', 'Fresh crisp lettuce leaves for salads and sandwiches', 31),
    ('https://static.vecteezy.com/system/resources/previews/001/343/690/large_2x/colorful-candies-on-white-background-free-photo.jpg', 'Candy', 20.00, 'Snacks', 'Sweet and crunchy candy', 0),
    ('https://static.vecteezy.com/system/resources/previews/002/983/269/large_2x/ripe-raspberries-with-raspberry-leaf-isolated-on-a-white-background-photo.JPG', 'Raspberries', 10.00, 'Fruits', 'Small, juicy berries with a delightfully sweet and gently tart finish.', 41),
    ('https://static.vecteezy.com/system/resources/previews/004/180/301/large_2x/fresh-slice-cucumber-on-white-background-photo.jpg', 'Cucumber', 2.00, 'Vegetables', 'Picked at peak ripeness, our cucumbers deliver an unrivaled, satisfying crunch', 45);

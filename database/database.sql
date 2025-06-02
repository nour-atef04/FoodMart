-- Create the store_products table
CREATE TABLE IF NOT EXISTS store_products (
    product_id SERIAL PRIMARY KEY,
    product_img TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price NUMERIC(10, 2) NOT NULL,
    product_category VARCHAR(100) NOT NULL,
    product_description TEXT
);

-- Insert sample data into store_products table
INSERT INTO store_products (product_img, product_name, product_price, product_category, product_description)
VALUES
    ('https://www.goodfruit.com/wp-content/uploads/snowflakeApple.jpg', 'Red Apples', 19.00, 'Fruits', 'Fresh, crisp red apples perfect for snacking or baking'),
    ('https://media.istockphoto.com/id/1184345169/photo/banana.jpg?s=612x612&w=0&k=20&c=NdHyi6Jd9y1855Q5mLO2tV_ZRnaJGtZGCSMMT7oxdF4=', 'Bananas', 24.00, 'Fruits', 'Sweet and ripe yellow bananas rich in potassium'),
    ('https://st2.depositphotos.com/16122460/42446/i/450/depositphotos_424463870-stock-photo-jug-glass-fresh-milk-white.jpg', 'Milk', 15.50, 'Dairy', 'Fresh whole milk from local dairy farms'),
    ('https://verdimed.com/wp-content/uploads/2021/10/product-others-carrots.jpg', 'Carrots', 2.00, 'Vegetables', 'Organic fresh carrots, great for salads and cooking'),
    ('https://img.freepik.com/premium-photo/potato-chips-white-background_55883-8452.jpg', 'Chips', 5.50, 'Snacks', 'Crispy potato chips with a perfect salt balance'),
    ('https://img.freepik.com/premium-photo/smooth-butter-elegance_996379-9801.jpg', 'Butter', 11.50, 'Dairy', 'Creamy unsalted butter perfect for cooking and baking'),
    ('https://img.freepik.com/premium-photo/plain-lettuce-isolated-white-background_434193-7334.jpg', 'Lettuce', 5.00, 'Vegetables', 'Fresh crisp lettuce leaves for salads and sandwiches');

-- Create the cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES store_products(product_id) ON DELETE CASCADE,
    item_quantity INTEGER NOT NULL,
    total_item_price NUMERIC(10, 2) NOT NULL
);

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update cart_items to associate with a user
ALTER TABLE cart_items
ADD COLUMN user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE;

-- Add name column to users
ALTER TABLE users ADD COLUMN name VARCHAR(255);

-- Add role column to users
ALTER TABLE users ADD COLUMN role VARCHAR(50);


-- FOR RECOMMENDATIONS
-- Create product similarities table for recommendations
CREATE TABLE IF NOT EXISTS product_similarities (
    product_id INTEGER REFERENCES store_products(product_id) ON DELETE CASCADE,
    similar_product_id INTEGER REFERENCES store_products(product_id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    PRIMARY KEY (product_id, similar_product_id),
    CHECK (similarity_score >= 0 AND similarity_score <= 1)
);

-- Create index for faster similarity lookups
CREATE INDEX IF NOT EXISTS idx_product_similarities_product_id 
ON product_similarities(product_id);

-- Create materialized view for popular products (to avoid recalculating similarity scores)
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

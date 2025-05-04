-- Create the store_products table
CREATE TABLE IF NOT EXISTS store_products (
    product_id SERIAL PRIMARY KEY,
    product_img TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price NUMERIC(10, 2) NOT NULL,
    product_category VARCHAR(100) NOT NULL
);

-- Insert sample data into store_products table
INSERT INTO store_products (product_img, product_name, product_price, product_category)
VALUES
    ('https://www.goodfruit.com/wp-content/uploads/snowflakeApple.jpg', 'Red Apples', 19.00, 'Fruits'),
    ('https://media.istockphoto.com/id/1184345169/photo/banana.jpg?s=612x612&w=0&k=20&c=NdHyi6Jd9y1855Q5mLO2tV_ZRnaJGtZGCSMMT7oxdF4=', 'Bananas', 24.00, 'Fruits'),
    ('https://st2.depositphotos.com/16122460/42446/i/450/depositphotos_424463870-stock-photo-jug-glass-fresh-milk-white.jpg', 'Milk', 15.50, 'Dairy'),
    ('https://verdimed.com/wp-content/uploads/2021/10/product-others-carrots.jpg', 'Carrots', 2.00, 'Vegetables'),
    ('https://img.freepik.com/premium-photo/potato-chips-white-background_55883-8452.jpg', 'Chips', 5.50, 'Snacks'),
    ('https://img.freepik.com/premium-photo/smooth-butter-elegance_996379-9801.jpg', 'Butter', 11.50, 'Dairy'),
    ('https://img.freepik.com/premium-photo/plain-lettuce-isolated-white-background_434193-7334.jpg', 'Lettuce', 5.00, 'Vegetables');

-- Create the cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES store_products(product_id) ON DELETE CASCADE,
    item_quantity INTEGER NOT NULL,
    total_item_price NUMERIC(10, 2) NOT NULL
);

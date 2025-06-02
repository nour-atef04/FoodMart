# HAVE TO RUN THIS SCRIPT TO UPDATE THE RECOMMENDATIONS PERIODICALLY
# HOW TO RUN (FROM TERMINAL):
# cd /e/REACT/foodmart
# source .venv/Scripts/activate
# cd backend
# pip install -r requirements.txt
# cd scripts
# python calculate_recommendations.py

import psycopg2
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pandas as pd
from dotenv import load_dotenv
import os
import sys
from pathlib import Path

# Add the parent directory to the Python path so we can import from parent directory
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env')

# Database connection parameters
DB_PARAMS = {
    'dbname': os.getenv('DB_NAME', 'foodmart'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

# Connect to the database
def connect_to_db():
    """Create database connection"""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        print("Successfully connected to the database")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

# Fetch all products from database
def get_products():
    """Fetch all products from database"""
    conn = connect_to_db()
    try:
        query = """
        SELECT 
            product_id as id,
            product_name as name,
            product_category as category,
            product_description as description,
            product_price as price,
            product_img as image_url
        FROM store_products
        """
        df = pd.read_sql(query, conn)
        print(f"Found {len(df)} products in database")
        return df
    except Exception as e:
        print(f"Error fetching products: {e}")
        sys.exit(1)
    finally:
        conn.close()

# Calculate similarity scores between products
def calculate_similarities(products_df):
    """Calculate similarity scores between products"""
    print("Calculating product similarities...")
    
    # Combine features for TF-IDF
    products_df['features'] = products_df.apply(
        lambda x: f"{x['name']} {x['category']} {str(x['description'] or '')}".lower(), 
        axis=1
    )
    
    # Create TF-IDF matrix
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(products_df['features'])
    
    # Calculate cosine similarity
    cosine_sim = cosine_similarity(tfidf_matrix)
    
    # Create similarity pairs
    similarities = []
    for idx in range(len(cosine_sim)):
        # Get top 5 similar products for each product
        similar_indices = cosine_sim[idx].argsort()[-6:-1][::-1]  # -6 to exclude self
        for sim_idx in similar_indices:
            if idx != sim_idx:  # Avoid self-similarity
                # Ensure similarity score is between 0 and 1
                similarity_score = float(cosine_sim[idx][sim_idx])
                similarity_score = min(max(similarity_score, 0.0), 1.0)  # Clamp between 0 and 1
                similarities.append({
                    'product_id': products_df.iloc[idx]['id'],
                    'similar_product_id': products_df.iloc[sim_idx]['id'],
                    'similarity_score': similarity_score
                })
    
    print(f"Generated {len(similarities)} product similarities")
    return pd.DataFrame(similarities)

# Update product similarities in database
def update_similarities(similarities_df):
    """Update product similarities in database"""
    conn = connect_to_db()
    cur = conn.cursor()
    
    try:
        print("Updating similarities in database...")
        # Clear existing similarities
        cur.execute("TRUNCATE TABLE product_similarities")
        
        # Insert new similarities
        for _, row in similarities_df.iterrows():
            cur.execute("""
                INSERT INTO product_similarities 
                (product_id, similar_product_id, similarity_score)
                VALUES (%s, %s, %s)
            """, (row['product_id'], row['similar_product_id'], row['similarity_score']))
        
        # Refresh materialized view
        print("Refreshing popular products view...")
        cur.execute("REFRESH MATERIALIZED VIEW popular_products")
        
        conn.commit()
        print("Successfully updated product similarities")
        
    except Exception as e:
        conn.rollback()
        print(f"Error updating similarities: {e}")
        sys.exit(1)
        
    finally:
        cur.close()
        conn.close()

# Main function to calculate and update recommendations
def main():
    """Main function to calculate and update recommendations"""
    try:
        print("Starting recommendation calculation...")
        # Get products
        products_df = get_products()
        
        if len(products_df) == 0:
            print("No products found in database")
            return
            
        # Calculate similarities
        similarities_df = calculate_similarities(products_df)
        
        # Update database
        update_similarities(similarities_df)
        
        print("Recommendation calculation completed successfully!")
        
    except Exception as e:
        print(f"Error in recommendation calculation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
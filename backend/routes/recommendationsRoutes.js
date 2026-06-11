import express from "express";
import pg from "pg";
import db from "../config/db.js";
import dotenv from "dotenv";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get recommendations based on cart items
// authenticate it to ensure unauthenticated users  cannot spam the database with complex similarity queries
router.post("/cart-recommendations", authenticateToken, async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      // Return popular products if no cart items
      const popularProducts = await db.query(`
        SELECT * FROM popular_products LIMIT 5
      `);
      return res.json(popularProducts.rows);
    }

    // Get product IDs from cart
    const cartProductIds = cartItems.map((item) => item.product_id);

    // Get recommendations based on cart items
    const recommendations = await db.query(
      `
      WITH cart_similarities AS (
        SELECT 
          ps.similar_product_id,
          sp.product_name as name,
          sp.product_category as category,
          sp.product_price as price,
          sp.product_img as image_url,
          MAX(ps.similarity_score) as similarity_score
        FROM product_similarities ps
        JOIN store_products sp ON sp.product_id = ps.similar_product_id
        WHERE ps.product_id = ANY($1)
        AND ps.similar_product_id != ALL($1)
        GROUP BY 
          ps.similar_product_id,
          sp.product_name,
          sp.product_category,
          sp.product_price,
          sp.product_img
      )
      SELECT DISTINCT ON (similar_product_id)
        similar_product_id as product_id,
        name,
        category,
        price,
        image_url,
        similarity_score
      FROM cart_similarities
      ORDER BY similar_product_id, similarity_score DESC
      LIMIT 5
      `,
      [cartProductIds]
    );

    res.json(recommendations.rows);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

router.get("/product/:productId", authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const recommendations = await db.query(
      `
      SELECT DISTINCT ON (ps.similar_product_id)
        sp.*,
        ps.similarity_score
      FROM product_similarities ps
      JOIN store_products sp ON sp.product_id = ps.similar_product_id
      WHERE ps.product_id = $1
        AND ps.similar_product_id != $1
      ORDER BY ps.similar_product_id, ps.similarity_score DESC
      LIMIT 6
      `,
      [productId],
    );

    res.json(recommendations.rows);
  } catch (error) {
    console.error("Error getting product recommendations:", error);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

export default router;

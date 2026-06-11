import express from "express";
import db from "../config/db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { parseStockQuantity } from "../utils/helpers.js";
import { recommendationsQueue } from "../config/queue.js";

const router = express.Router();

// GET ALL STORE PRODUCTS
router.get("/", authenticateToken, async (req, res) => {
  const { search = "", category = "" } = req.query;

  try {
    const conditions = [];
    const values = [];

    if (category.trim()) {
      values.push(category.trim());
      conditions.push(`product_category = $${values.length}`);
    }

    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(
        `(product_name ILIKE $${values.length} OR product_description ILIKE $${values.length} OR product_category ILIKE $${values.length})`,
      );
    }

    const query = [
      "SELECT * FROM store_products",
      conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
      "ORDER BY product_name ASC",
    ]
      .filter(Boolean)
      .join(" ");

    const result = await db.query(query, values);
    res.status(200).json(result.rows); // RETURN ALL STORE PRODUCTS
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// GET ONE
router.get("/:product_id", authenticateToken, async (req, res) => {
  const { product_id } = req.params;

  try {
    const result = await db.query(
      "SELECT * FROM store_products WHERE product_id = $1",
      [product_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
      error: error.message,
    });
  }
});

// ADD NEW PRODUCT (Admin Only)
router.post(
  "/",
  authenticateToken,
  requireRole("employee"),
  async (req, res) => {
    const {
      product_name,
      product_description,
      product_price,
      product_category,
      product_img,
      stock_quantity,
    } = req.body;

    console.log("Adding new product:", product_name);
    console.log("Category:", product_category);
    console.log("Price:", product_price);

    // Basic validation
    if (
      !product_name ||
      !product_img ||
      !product_price ||
      !product_category ||
      !product_description
    ) {
      return res.status(400).json({
        message:
          "Product name, image, category, description and price are required",
      });
    }

    const parsedStockQuantity = parseStockQuantity(stock_quantity, 0);
    if (parsedStockQuantity === null) {
      return res
        .status(400)
        .json({ message: "Stock quantity must be a non-negative number" });
    }

    try {
      const result = await db.query(
        "INSERT INTO store_products (product_name, product_description, product_img, product_price, product_category, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id, product_name, product_description, product_img, product_price, product_category, stock_quantity",
        [
          product_name,
          product_description,
          product_img,
          product_price,
          product_category,
          parsedStockQuantity,
        ],
      );

      const newProduct = result.rows[0];

      await recommendationsQueue.add("update-recs", {});

      res.status(201).json({
        message: "Product added successfully",
        product: newProduct,
      });
    } catch (error) {
      console.error("Product addition error:", error);
      res.status(500).json({
        message: "Product addition failed",
        error: error.message,
      });
    }
  },
);

// UPDATE PRODUCT (Admin Only)
router.put(
  "/:product_id",
  authenticateToken,
  requireRole("employee"),
  async (req, res) => {
    const { product_id } = req.params;
    const {
      product_name,
      product_description,
      product_img,
      product_price,
      product_category,
      stock_quantity,
    } = req.body;

    // Basic validation
    if (
      !product_name ||
      !product_description ||
      !product_img ||
      !product_price ||
      !product_category
    ) {
      return res.status(400).json({
        message:
          "Product name, description, image, price, and category are required",
      });
    }

    const parsedStockQuantity = parseStockQuantity(stock_quantity);
    if (parsedStockQuantity === null) {
      return res
        .status(400)
        .json({ message: "Stock quantity must be a non-negative number" });
    }

    try {
      const result = await db.query(
        "UPDATE store_products SET product_name = $1, product_description = $2, product_img = $3, product_price = $4, product_category = $5, stock_quantity = $6 WHERE product_id = $7 RETURNING product_id, product_name, product_description, product_img, product_price, product_category, stock_quantity",
        [
          product_name,
          product_description,
          product_img,
          product_price,
          product_category,
          parsedStockQuantity,
          product_id,
        ],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = result.rows[0];

      await recommendationsQueue.add("update-recs", {});

      res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Product update error:", error);
      res.status(500).json({
        message: "Product update failed",
        error: error.message,
      });
    }
  },
);

// DELETE PRODUCT (Admin Only)
router.delete(
  "/:product_id",
  authenticateToken,
  requireRole("employee"),
  async (req, res) => {
    const { product_id } = req.params;

    try {
      const result = await db.query(
        "DELETE FROM store_products WHERE product_id = $1 RETURNING product_id",
        [product_id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      await recommendationsQueue.add("update-recs", {});

      res.status(200).json({
        message: "Product deleted successfully",
        product_id: product_id,
      });
    } catch (error) {
      console.error("Product deletion error:", error);
      res.status(500).json({
        message: "Product deletion failed",
        error: error.message,
      });
    }
  },
);

export default router;

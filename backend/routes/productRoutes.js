import express from "express";
import db from "../config/db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { parseStockQuantity } from "../utils/helpers.js";
import { recommendationsQueue } from "../config/queue.js";

const router = express.Router();

// GET ALL STORE PRODUCTS
router.get("/", authenticateToken, async (req, res, next) => {
  const { search = "", category = "", page = "1", limit = "10" } = req.query;

  try {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const values = [];

    // apply category filter
    if (category.trim()) {
      values.push(category.trim());
      conditions.push(`product_category = $${values.length}`);
    }

    // apply search filter
    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(
        `(product_name ILIKE $${values.length} OR product_description ILIKE $${values.length} OR product_category ILIKE $${values.length})`,
      );
    }

    // count total items (for frontend pagination controls)
    const countQuery = [
      "SELECT COUNT(*) FROM store_products",
      conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const countResult = await db.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limitNum);

    // add LIMIT and OFFSET to the main query securely
    values.push(limitNum);
    const limitParamIndex = values.length;

    values.push(offset);
    const offsetParamIndex = values.length;

    const query = [
      "SELECT * FROM store_products",
      conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
      "ORDER BY product_name ASC",
      `LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    ]
      .filter(Boolean)
      .join(" ");

    const result = await db.query(query, values);

    // return the products + the pagination metadata
    res.status(200).json({
      products: result.rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET ONE
router.get("/:product_id", authenticateToken, async (req, res, next) => {
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
    next(error);
  }
});

// ADD NEW PRODUCT (Admin Only)
router.post(
  "/",
  authenticateToken,
  requireRole("employee"),
  async (req, res, next) => {
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

      // drops a ticket into the queue and immediately returns a success response to the client
      // empty payload since only a command is called
      await recommendationsQueue.add("update-recs", {});

      res.status(201).json({
        message: "Product added successfully",
        product: newProduct,
      });
    } catch (error) {
      next(error);
    }
  },
);

// UPDATE PRODUCT (Admin Only)
router.put(
  "/:product_id",
  authenticateToken,
  requireRole("employee"),
  async (req, res, next) => {
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
      next(error);
    }
  },
);

// DELETE PRODUCT (Admin Only)
router.delete(
  "/:product_id",
  authenticateToken,
  requireRole("employee"),
  async (req, res, next) => {
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
      next(error);
    }
  },
);

export default router;

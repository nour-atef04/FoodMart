import express from "express";
import db from "../config/db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { recommendationsQueue } from "../config/queue.js";
import {
  productIdParamSchema,
  productMutationSchema,
  getProductsSchema,
} from "../zodSchemas/productSchemas.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// GET ALL STORE PRODUCTS
router.get(
  "/",
  authenticateToken,
  validate(getProductsSchema),
  async (req, res, next) => {
    const { search, category, page, limit } = req.query;

    try {
      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];

      // apply category filter
      if (category) {
        values.push(category);
        conditions.push(`product_category = $${values.length}`);
      }

      // apply search filter
      if (search) {
        values.push(`%${search}%`);
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
      const totalPages = Math.ceil(totalItems / limit);

      // add LIMIT and OFFSET to the main query securely
      values.push(limit);
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
          currentPage: page,
          limit: limit,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET ONE
router.get(
  "/:product_id",
  authenticateToken,
  validate(productIdParamSchema),
  async (req, res, next) => {
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
  },
);

// ADD NEW PRODUCT (Admin Only)
router.post(
  "/",
  authenticateToken,
  requireRole("employee"),
  validate(productMutationSchema),
  async (req, res, next) => {
    const {
      product_name,
      product_description,
      product_price,
      product_category,
      product_img,
      stock_quantity,
    } = req.body;

    try {
      const result = await db.query(
        "INSERT INTO store_products (product_name, product_description, product_img, product_price, product_category, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id, product_name, product_description, product_img, product_price, product_category, stock_quantity",
        [
          product_name,
          product_description,
          product_img,
          product_price,
          product_category,
          stock_quantity,
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
// .merge() combines the parameter validation (product_id) with the body validation (product details)
router.put(
  "/:product_id",
  authenticateToken,
  requireRole("employee"),
  validate(productIdParamSchema.merge(productMutationSchema)),
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

    try {
      const result = await db.query(
        "UPDATE store_products SET product_name = $1, product_description = $2, product_img = $3, product_price = $4, product_category = $5, stock_quantity = $6 WHERE product_id = $7 RETURNING product_id, product_name, product_description, product_img, product_price, product_category, stock_quantity",
        [
          product_name,
          product_description,
          product_img,
          product_price,
          product_category,
          stock_quantity,
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
  validate(productIdParamSchema),
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

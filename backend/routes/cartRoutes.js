import express from "express";
import db from "../config/db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET ALL CART ITEMS
router.get(
  "/cartItems",
  authenticateToken,
  requireRole("customer"),
  async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT 
        cart_items.product_id,
        store_products.product_img,
        store_products.product_name,
        store_products.product_price,
        cart_items.item_quantity,
        cart_items.total_item_price
      FROM 
        cart_items
      JOIN 
        store_products
      ON 
        cart_items.product_id = store_products.product_id
      WHERE 
        cart_items.user_id = $1`,
        [req.user.user_id],
      );
      res.status(200).json(result.rows); // RETURN ALL CART ITEMS
    } catch (error) {
      next(error);
    }
  },
);

// POST NEW CART ITEM OR UPDATE IF EXISTS
router.post(
  "/cartItems",
  authenticateToken,
  requireRole("customer"),
  async (req, res, next) => {
    const { product_id, item_quantity, total_item_price } = req.body;
    const user_id = req.user.user_id;
    try {
      const requestedQuantity = Number.parseInt(item_quantity, 10);
      if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
        return res
          .status(400)
          .json({ message: "Item quantity must be at least 1" });
      }

      const productResult = await db.query(
        "SELECT stock_quantity, product_price FROM store_products WHERE product_id = $1",
        [product_id],
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      const availableStock =
        Number.parseInt(productResult.rows[0].stock_quantity, 10) || 0;
      const productPrice = Number(productResult.rows[0].product_price) || 0;
      const existingItem = await db.query(
        "SELECT * FROM cart_items WHERE product_id = $1 AND user_id = $2",
        [product_id, user_id],
      );

      const currentCartQuantity =
        existingItem.rows.length > 0
          ? Number.parseInt(existingItem.rows[0].item_quantity, 10) || 0
          : 0;
      const remainingStock = availableStock - currentCartQuantity;

      if (remainingStock <= 0 || requestedQuantity > remainingStock) {
        return res.status(409).json({
          message: "Not enough stock available",
          availableStock,
        });
      }

      if (existingItem.rows.length > 0) {
        const currentQuantity = currentCartQuantity;
        const currentTotalPrice = parseFloat(
          existingItem.rows[0].total_item_price,
        );
        const new_item_quantity = currentQuantity + requestedQuantity;
        const new_total_item_price =
          currentTotalPrice + productPrice * requestedQuantity;

        // Update the existing item
        await db.query(
          "UPDATE cart_items SET item_quantity = $1, total_item_price = $2 WHERE product_id = $3 AND user_id = $4",
          [new_item_quantity, new_total_item_price, product_id, user_id],
        );
      }
      // Add new item if no existing item with same id
      else {
        await db.query(
          "INSERT INTO cart_items (user_id, product_id, item_quantity, total_item_price) VALUES($1, $2, $3, $4)",
          [
            user_id,
            product_id,
            requestedQuantity,
            productPrice * requestedQuantity,
          ],
        );
      }

      res.status(200).json({ message: "Cart updated" });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE CART ITEM
router.delete(
  "/cartItems/:product_id",
  authenticateToken,
  requireRole("customer"),
  async (req, res, next) => {
    const { product_id } = req.params;
    const user_id = req.user.user_id;
    try {
      await db.query(
        "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2",
        [user_id, product_id],
      );
      res.status(200).json({ message: "Item removed" });
    } catch (error) {
      next(error);
    }
  },
);

// CHECKOUT
router.post(
  "/checkout",
  authenticateToken,
  requireRole("customer"),
  async (req, res, next) => {
    const userId = req.user.user_id;

    try {
      // start the transaction
      await db.query("BEGIN");

      // set the safety timeout
      // LOCAL to apply only to that current transaction
      await db.query("SET LOCAL statement_timeout = '5s'");

      const cartResult = await db.query(
        `SELECT 
        cart_items.product_id,
        cart_items.item_quantity,
        store_products.stock_quantity
      FROM cart_items
      JOIN store_products
        ON cart_items.product_id = store_products.product_id
      WHERE cart_items.user_id = $1
      FOR UPDATE OF store_products`,
        [userId],
      );

      if (cartResult.rows.length === 0) {
        await db.query("COMMIT");
        return res.status(200).json({ message: "Cart already empty" });
      }

      for (const item of cartResult.rows) {
        const stockQuantity = Number.parseInt(item.stock_quantity, 10) || 0;
        const cartQuantity = Number.parseInt(item.item_quantity, 10) || 0;

        if (stockQuantity < cartQuantity) {
          await db.query("ROLLBACK");
          return res.status(409).json({
            message: "One or more products are out of stock",
            product_id: item.product_id,
          });
        }

        const updateResult = await db.query(
          `UPDATE store_products
         SET stock_quantity = stock_quantity - $1
         WHERE product_id = $2 AND stock_quantity >= $1
         RETURNING stock_quantity`,
          [cartQuantity, item.product_id],
        );

        if (updateResult.rows.length === 0) {
          await db.query("ROLLBACK");
          return res.status(409).json({
            message: "One or more products are out of stock",
            product_id: item.product_id,
          });
        }
      }

      await db.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
      await db.query("COMMIT");

      res.status(200).json({ message: "Checkout completed successfully" });
    } catch (error) {
      try {
        await db.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }

      next(error);
    }
  },
);

export default router;

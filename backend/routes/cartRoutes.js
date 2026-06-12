import express from "express";
import db from "../config/db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { cartItemSchema } from "../zodSchemas/cartSchemas.js";

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
        -- calculate the total live right in the query
        (store_products.product_price * cart_items.item_quantity) AS total_item_price
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
  validate(cartItemSchema),
  async (req, res, next) => {
    const { product_id, item_quantity } = req.body;
    const user_id = req.user.user_id;
    const requestedQuantity = item_quantity;
    try {
      // start the transaction and set safety timeout
      await db.query("BEGIN");
      await db.query("SET LOCAL statement_timeout = '5s'");

      // lock product row to prevent different users from grabbing the last piece of stock at the exact same time
      const productResult = await db.query(
        "SELECT stock_quantity FROM store_products WHERE product_id = $1 FOR UPDATE",
        [product_id],
      );

      if (productResult.rows.length === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({ message: "Product not found" });
      }

      const availableStock =
        Number.parseInt(productResult.rows[0].stock_quantity, 10) || 0;

      console.log(
        "Request:",
        process.hrtime.bigint().toString(),
        "stock:",
        availableStock,
        "user:",
        user_id,
      );

      // Get the current cart item for this user and product
      const existingItem = await db.query(
        `SELECT item_quantity FROM cart_items WHERE product_id = $1 AND user_id = $2`,
        [product_id, user_id],
      );

      const currentCartQuantity =
        existingItem.rows.length > 0
          ? Number.parseInt(existingItem.rows[0].item_quantity, 10) || 0
          : 0;

      // Get the total quantity of this product across ALL users' carts
      const totalInCarts = await db.query(
        `SELECT COALESCE(SUM(item_quantity), 0) as total FROM cart_items WHERE product_id = $1`,
        [product_id],
      );

      const usedStock = Number.parseInt(totalInCarts.rows[0].total, 10) || 0;
      const remainingStock = availableStock - usedStock;

      console.log("Current cart quantity:", currentCartQuantity);
      console.log("Used stock by all users:", usedStock);
      console.log("Remaining stock:", remainingStock);

      // Check if adding this request's quantity would exceed available stock
      if (requestedQuantity > remainingStock) {
        await db.query("ROLLBACK");
        return res.status(409).json({
          message: "Not enough stock available",
          availableStock,
          usedStock,
          remainingStock,
        });
      }

      if (existingItem.rows.length > 0) {
        const new_item_quantity = currentCartQuantity + requestedQuantity;

        // Update the existing item
        await db.query(
          "UPDATE cart_items SET item_quantity = $1 WHERE product_id = $2 AND user_id = $3",
          [new_item_quantity, product_id, user_id],
        );
      }
      // Add new item if no existing item with same id
      else {
        await db.query(
          "INSERT INTO cart_items (user_id, product_id, item_quantity) VALUES($1, $2, $3)",
          [user_id, product_id, requestedQuantity],
        );
      }
      // save the data and release the locks
      await db.query("COMMIT");
      res.status(200).json({ message: "Cart updated" });
    } catch (error) {
      // recover safely from any database crashes
      try {
        await db.query("ROLLBACK");
      } catch (rollbackError) {
        req.log.error(
          { err: rollbackError },
          "Database ROLLBACK failed during add to cart",
        );
      }
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

      // pull the live product_price straight from the store_products table
      const cartResult = await db.query(
        `SELECT 
          cart_items.product_id,
          cart_items.item_quantity,
          store_products.stock_quantity,
          store_products.product_price
        FROM cart_items
        JOIN store_products
          ON cart_items.product_id = store_products.product_id
        WHERE cart_items.user_id = $1
        FOR UPDATE OF store_products`,
        [userId],
      );

      if (cartResult.rows.length === 0) {
        await db.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Cannot checkout with an empty cart" });
      }

      let orderTotalCents = 0;

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

        // dynamically calculate the safe cost using the LIVE price not the cart price
        const livePriceCents =
          Math.round(Number(item.product_price) * 100) || 0;
        orderTotalCents += livePriceCents * cartQuantity;

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

      const finalOrderTotal = orderTotalCents / 100;

      res.status(200).json({
        message: "Checkout completed successfully",
        total_charged: finalOrderTotal,
      });
    } catch (error) {
      try {
        await db.query("ROLLBACK");
      } catch (rollbackError) {
        req.log.error(
          { err: rollbackError },
          "Database ROLLBACK failed during checkout",
        );
      }

      next(error);
    }
  },
);

export default router;

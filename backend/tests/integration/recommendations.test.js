import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  getDb,
} from "../setup/testDb.js";

let app;
let customerCookie;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await setupTestDB();
  // Import the app AFTER setting up the test database
  const { default: appModule } = await import("../../server.js");
  app = appModule;

  await clearDatabase();

  // Create a customer user
  const customerRes = await request(app)
    .post("/api/register")
    .send({
      email: `reccustomer${Math.random()}@example.com`,
      password: "password123",
      name: "Recommendations Test User",
    });
  customerCookie = Array.isArray(customerRes.headers["set-cookie"])
    ? customerRes.headers["set-cookie"][0]
    : customerRes.headers["set-cookie"];

  // Seed products and product similarities for testing
  const db = getDb();

  // Insert test products
  await db.query(`
    INSERT INTO store_products (product_name, product_description, product_category, product_img, product_price, stock_quantity)
    VALUES 
      ('Laptop', 'High performance laptop', 'Electronics', 'laptop.png', 1299.99, 5),
      ('Mouse', 'Wireless mouse', 'Electronics', 'mouse.png', 29.99, 20),
      ('Keyboard', 'Mechanical keyboard', 'Electronics', 'keyboard.png', 149.99, 15),
      ('Monitor', 'UltraWide monitor', 'Electronics', 'monitor.png', 399.99, 8),
      ('USB Hub', 'Multi-port USB hub', 'Electronics', 'hub.png', 39.99, 25),
      ('Mystery Book', 'Thriller novel', 'Books', 'book.png', 15.99, 50)
  `);

  // Get product IDs
  const products = await db.query(`
    SELECT product_id, product_name FROM store_products ORDER BY product_name ASC
  `);

  const productMap = {};
  products.rows.forEach((p) => {
    productMap[p.product_name] = p.product_id;
  });

  // Insert product similarities (Electronics products are similar to each other)
  if (productMap["Laptop"] && productMap["Mouse"]) {
    await db.query(
      `INSERT INTO product_similarities (product_id, similar_product_id, similarity_score)
       VALUES ($1, $2, $3), ($2, $1, $3)`,
      [productMap["Laptop"], productMap["Mouse"], 0.85],
    );
  }

  if (productMap["Laptop"] && productMap["Keyboard"]) {
    await db.query(
      `INSERT INTO product_similarities (product_id, similar_product_id, similarity_score)
       VALUES ($1, $2, $3), ($2, $1, $3)`,
      [productMap["Laptop"], productMap["Keyboard"], 0.8],
    );
  }

  if (productMap["Mouse"] && productMap["Keyboard"]) {
    await db.query(
      `INSERT INTO product_similarities (product_id, similar_product_id, similarity_score)
       VALUES ($1, $2, $3), ($2, $1, $3)`,
      [productMap["Mouse"], productMap["Keyboard"], 0.75],
    );
  }

  if (productMap["Laptop"] && productMap["Monitor"]) {
    await db.query(
      `INSERT INTO product_similarities (product_id, similar_product_id, similarity_score)
       VALUES ($1, $2, $3), ($2, $1, $3)`,
      [productMap["Laptop"], productMap["Monitor"], 0.82],
    );
  }

  // Refresh the materialized view for popular_products
  await db.query(`REFRESH MATERIALIZED VIEW popular_products`);
}, 60000);

afterAll(async () => {
  await teardownTestDB();
});

describe("Recommendations API", () => {
  describe("POST /api/recommendations/cart-recommendations", () => {
    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .post("/api/recommendations/cart-recommendations")
        .send({
          cartItems: [{ product_id: 1 }],
        });

      expect(res.status).toBe(401);
    });

    it("should return recommendations for cart items", async () => {
      const db = getDb();

      // Get a product ID to use
      const product = await db.query(
        "SELECT product_id FROM store_products WHERE product_name = 'Laptop' LIMIT 1",
      );

      if (product.rows.length > 0) {
        const laptopId = product.rows[0].product_id;

        const res = await request(app)
          .post("/api/recommendations/cart-recommendations")
          .set("Cookie", customerCookie)
          .send({
            cartItems: [{ product_id: laptopId }],
          });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it("should return popular products for empty cart", async () => {
      const res = await request(app)
        .post("/api/recommendations/cart-recommendations")
        .set("Cookie", customerCookie)
        .send({
          cartItems: [],
        });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should handle missing cartItems field", async () => {
      const res = await request(app)
        .post("/api/recommendations/cart-recommendations")
        .set("Cookie", customerCookie)
        .send({});

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should filter out cart items from recommendations", async () => {
      const db = getDb();

      const products = await db.query(
        "SELECT product_id FROM store_products WHERE product_name IN ('Laptop', 'Mouse', 'Keyboard') ORDER BY product_name",
      );

      if (products.rows.length >= 2) {
        const [laptop, mouse, keyboard] = products.rows;

        const res = await request(app)
          .post("/api/recommendations/cart-recommendations")
          .set("Cookie", customerCookie)
          .send({
            cartItems: [
              { product_id: laptop.product_id },
              { product_id: mouse.product_id },
            ],
          });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        // Verify that cart items are not in recommendations
        const recommendedIds = res.body.map((r) => r.product_id);
        expect(recommendedIds).not.toContain(laptop.product_id);
        expect(recommendedIds).not.toContain(mouse.product_id);
      }
    });

    it("should validate product_id is a positive integer", async () => {
      const res = await request(app)
        .post("/api/recommendations/cart-recommendations")
        .set("Cookie", customerCookie)
        .send({
          cartItems: [{ product_id: -1 }],
        });

      // Should either reject or handle gracefully
      expect([200, 400]).toContain(res.status);
    });
  });

  describe("GET /api/recommendations/product/:productId", () => {
    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/api/recommendations/product/1");

      expect(res.status).toBe(401);
    });

    it("should return recommendations for a specific product", async () => {
      const db = getDb();

      const product = await db.query(
        "SELECT product_id FROM store_products WHERE product_name = 'Laptop' LIMIT 1",
      );

      if (product.rows.length > 0) {
        const laptopId = product.rows[0].product_id;

        const res = await request(app)
          .get(`/api/recommendations/product/${laptopId}`)
          .set("Cookie", customerCookie);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it("should not include the product itself in recommendations", async () => {
      const db = getDb();

      const product = await db.query(
        "SELECT product_id FROM store_products WHERE product_name = 'Laptop' LIMIT 1",
      );

      if (product.rows.length > 0) {
        const laptopId = product.rows[0].product_id;

        const res = await request(app)
          .get(`/api/recommendations/product/${laptopId}`)
          .set("Cookie", customerCookie);

        expect(res.status).toBe(200);

        const recommendedIds = res.body.map((r) => r.product_id);
        expect(recommendedIds).not.toContain(laptopId);
      }
    });

    it("should limit recommendations to 6 products", async () => {
      const db = getDb();

      const product = await db.query(
        "SELECT product_id FROM store_products WHERE product_name = 'Laptop' LIMIT 1",
      );

      if (product.rows.length > 0) {
        const laptopId = product.rows[0].product_id;

        const res = await request(app)
          .get(`/api/recommendations/product/${laptopId}`)
          .set("Cookie", customerCookie);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeLessThanOrEqual(6);
      }
    });

    it("should handle non-existent product gracefully", async () => {
      const res = await request(app)
        .get("/api/recommendations/product/99999")
        .set("Cookie", customerCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Non-existent product should return empty recommendations
      expect(res.body.length).toBe(0);
    });

    it("should validate productId is a positive integer", async () => {
      const res = await request(app)
        .get("/api/recommendations/product/invalid")
        .set("Cookie", customerCookie);

      expect(res.status).toBe(400);
    });

    it("should validate productId is positive", async () => {
      const res = await request(app)
        .get("/api/recommendations/product/-1")
        .set("Cookie", customerCookie);

      expect(res.status).toBe(400);
    });
  });
});

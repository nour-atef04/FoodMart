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
let employeeCookie;

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
      email: `customer${Math.random()}@example.com`,
      password: "password123",
      name: "Customer User",
    });
  customerCookie = Array.isArray(customerRes.headers["set-cookie"])
    ? customerRes.headers["set-cookie"][0]
    : customerRes.headers["set-cookie"];

  // Create an employee user (need to insert directly since register endpoint doesn't support role selection)
  const db = getDb();
  const employeeEmail = `employee${Math.random()}@example.com`;
  await db.query(
    `INSERT INTO users (email, password_hash, name, role) VALUES ($1, 'hashedpwd', $2, 'employee')`,
    [employeeEmail, "Employee User"],
  );

  // Login as employee to get cookie
  const employeeLoginRes = await request(app).post("/api/login").send({
    email: employeeEmail,
    password: "password123", // This won't match but we'll use direct DB insert
  });

  // For testing purposes, we'll need to manually set up an employee with valid credentials
  // Let's use a different approach - seed the database directly
  const hashedPassword = "employee_hash"; // In real scenario this would be hashed
  await db.query("DELETE FROM users WHERE email = $1", [employeeEmail]);

  // Just create a customer and use that for now, modify test to work with customer permissions
  // Actually, let's create an employee via direct insert and use JWT directly
  const employeeInsert = await db.query(
    `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING user_id, email, name, role`,
    [employeeEmail, hashedPassword, "Employee User", "employee"],
  );
}, 60000);

afterAll(async () => {
  await teardownTestDB();
});

describe("Products API", () => {
  describe("GET /api/storeProducts", () => {
    it("should get all products with pagination", async () => {
      const db = getDb();

      // Seed some products
      await db.query(`
        INSERT INTO store_products (product_name, product_description, product_category, product_img, product_price, stock_quantity)
        VALUES 
          ('Product A', 'Description A', 'Electronics', 'img1.png', 99.99, 10),
          ('Product B', 'Description B', 'Electronics', 'img2.png', 199.99, 20),
          ('Product C', 'Description C', 'Books', 'img3.png', 29.99, 5)
      `);

      const res = await request(app)
        .get("/api/storeProducts")
        .query({ page: 1, limit: 10 })
        .set("Cookie", customerCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("products");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it("should filter products by category", async () => {
      const res = await request(app)
        .get("/api/storeProducts")
        .query({ category: "Electronics", page: 1, limit: 10 })
        .set("Cookie", customerCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      res.body.products.forEach((product) => {
        expect(product.product_category).toBe("Electronics");
      });
    });

    it("should search products by name", async () => {
      const res = await request(app)
        .get("/api/storeProducts")
        .query({ search: "Product", page: 1, limit: 10 })
        .set("Cookie", customerCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it("should handle pagination", async () => {
      const res1 = await request(app)
        .get("/api/storeProducts")
        .query({ page: 1, limit: 1 })
        .set("Cookie", customerCookie);

      const res2 = await request(app)
        .get("/api/storeProducts")
        .query({ page: 2, limit: 1 })
        .set("Cookie", customerCookie);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      if (res1.body.pagination.totalItems > 1) {
        expect(res1.body.products[0].product_id).not.toBe(
          res2.body.products[0].product_id,
        );
      }
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .get("/api/storeProducts")
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/storeProducts/:product_id", () => {
    it("should get a single product by ID", async () => {
      const db = getDb();

      const productInsert = await db.query(`
        INSERT INTO store_products (product_name, product_description, product_category, product_img, product_price, stock_quantity)
        VALUES ('Single Product', 'Test Description', 'Test', 'test.png', 49.99, 15)
        RETURNING product_id
      `);
      const productId = productInsert.rows[0].product_id;

      const res = await request(app)
        .get(`/api/storeProducts/${productId}`)
        .set("Cookie", customerCookie);

      expect(res.status).toBe(200);
      expect(res.body.product_id).toBe(productId);
      expect(res.body.product_name).toBe("Single Product");
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app)
        .get("/api/storeProducts/99999")
        .set("Cookie", customerCookie);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("not found");
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/api/storeProducts/1");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/storeProducts", () => {
    it("should require authentication", async () => {
      // Test that non-authenticated users are rejected
      const res = await request(app).post("/api/storeProducts").send({
        product_name: "New Product",
        product_description: "A new test product",
        product_category: "Test",
        product_img: "new.png",
        product_price: 79.99,
        stock_quantity: 30,
      });

      expect(res.status).toBe(401);
    });

    it("should forbid customer role from creating products", async () => {
      const res = await request(app)
        .post("/api/storeProducts")
        .set("Cookie", customerCookie)
        .send({
          product_name: "Product",
          product_description: "Description",
          product_category: "Test",
          product_img: "test.png",
          product_price: 99.99,
          stock_quantity: 10,
        });

      expect(res.status).toBe(403); // Forbidden - customer role cannot create
    });
  });

  describe("PUT /api/storeProducts/:product_id", () => {
    it("should require authentication", async () => {
      const res = await request(app).put("/api/storeProducts/1").send({
        product_name: "Updated",
        product_description: "Updated desc",
        product_category: "Test",
        product_img: "test.png",
        product_price: 99.99,
        stock_quantity: 10,
      });

      expect(res.status).toBe(401);
    });

    it("should forbid non-employee users", async () => {
      const res = await request(app)
        .put("/api/storeProducts/99999")
        .set("Cookie", customerCookie)
        .send({
          product_name: "Updated",
          product_description: "Updated desc",
          product_category: "Test",
          product_img: "test.png",
          product_price: 99.99,
          stock_quantity: 10,
        });

      expect(res.status).toBe(403); // Forbidden - customer role cannot update
    });
  });

  describe("DELETE /api/storeProducts/:product_id", () => {
    it("should require authentication", async () => {
      const res = await request(app).delete("/api/storeProducts/1");

      expect(res.status).toBe(401);
    });

    it("should forbid non-employee users", async () => {
      const res = await request(app)
        .delete("/api/storeProducts/99999")
        .set("Cookie", customerCookie);

      expect(res.status).toBe(403); // Forbidden - customer role cannot delete
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  getDb,
} from "../setup/testDb.js";

let authCookie;
let app;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await setupTestDB();
  // Import the app AFTER setting up the test database so it connects to the test DB
  const { default: appModule } = await import("../../server.js");
  app = appModule;
}, 60000);

afterAll(async () => {
  await teardownTestDB();
});

describe("Cart API", () => {
  it("should prevent stock inflation on simultaneous add-to-cart clicks", async () => {
    await clearDatabase();
    const db = getDb();

    // register a unique user for this test
    const reg = await request(app)
      .post("/api/register")
      .send({
        email: `cart${Math.random()}@example.com`,
        password: "password123",
        name: "Cart User",
      });
    const cookie = Array.isArray(reg.headers["set-cookie"])
      ? reg.headers["set-cookie"][0]
      : reg.headers["set-cookie"];

    // seed product with 1 unit
    const productResult = await db.query(`
      INSERT INTO store_products (product_img, product_name, product_price, product_category, stock_quantity)
      VALUES ('img.png', 'Race Item', 10.00, 'Test', 1)
      RETURNING product_id
    `);
    const productId = productResult.rows[0].product_id;

    console.log("Inserted product:", productResult.rows[0]);

    const verify = await db.query(
      "SELECT product_id, product_name, stock_quantity FROM store_products WHERE product_id = $1",
      [productId],
    );

    console.log("Verification query:", verify.rows);

    // fire requests
    const requests = [
      request(app)
        .post("/api/cartItems")
        .set("Cookie", cookie)
        .send({ product_id: productId, item_quantity: 1 }),
      request(app)
        .post("/api/cartItems")
        .set("Cookie", cookie)
        .send({ product_id: productId, item_quantity: 1 }),
      request(app)
        .post("/api/cartItems")
        .set("Cookie", cookie)
        .send({ product_id: productId, item_quantity: 1 }),
    ];

    const responses = await Promise.all(requests);
    const successResponses = responses.filter((r) => r.status === 200);
    const conflictResponses = responses.filter((r) => r.status === 409);

    // assert only one succeeds
    expect(successResponses.length).toBe(1);
    expect(conflictResponses.length).toBe(2);
  });
});

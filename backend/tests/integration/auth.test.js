import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../server.js"; // export Express app without calling app.listen()
import { setupTestDB, teardownTestDB, clearDatabase } from "../setup/testDb.js";

let db;

beforeAll(async () => {
  // set the environment to test so we don't start the real server
  process.env.NODE_ENV = "test";
  await setupTestDB();
}, 60000);

afterAll(async () => {
  await teardownTestDB();
});

describe("Authentication API", () => {
  describe("POST /api/register", () => {
    it("should register a new user and return a cookie", async () => {
      const res = await request(app)
        .post("/api/register")
        .send({
          email: `new${Math.random()}@example.com`,
          password: "securepassword123",
          name: "New User",
        });

      expect(res.status).toBe(201);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 for missing Zod fields", async () => {
      const res = await request(app).post("/api/register").send({
        email: "baduser@example.com",
        // missing password and name
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid request data");
    });
  });

  describe("POST /api/login", () => {
    it("should login successfully", async () => {
      const email = `login${Math.random()}@example.com`;
      const registerRes = await request(app).post("/api/register").send({
        email,
        password: "mypassword123",
        name: "User",
      });
      expect(registerRes.status).toBe(201); // catch silent register failures early

      const res = await request(app).post("/api/login").send({
        email,
        password: "mypassword123",
      });
      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
    });
  });
});

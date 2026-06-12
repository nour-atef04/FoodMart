// Testcontainers to spin up a completely isolated PostgreSQL database in Docker ensuring real development data is never touched
import { fileURLToPath } from "url";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let container;
let db;

export const setupTestDB = async () => {
  // start a fresh, isolated Postgres Docker container
  container = await new PostgreSqlContainer("postgres:15-alpine").start();

  process.env.DB_USER = container.getUsername();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = container.getPort();
  process.env.DB_NAME = container.getDatabase();

  // connect to it
  db = new pg.Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });

  // run database.sql to create the tables
  const schemaPath = path.resolve(__dirname, "../../../database/database.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await db.query(schema);
  
  return db;
};

export const teardownTestDB = async () => {
  if (db) await db.end();
  if (container) await container.stop();
};

export const clearDatabase = async () => {
  // wipes all data but keeps the tables intact before every test
  await db.query(`
    TRUNCATE cart_items, product_similarities, store_products, users RESTART IDENTITY CASCADE;
  `);
};

export const getDb = () => db;
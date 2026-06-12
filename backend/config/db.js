import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
});

db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
  } else {
    console.log("Connected to the database pool successfully");
  }
});

// Catch pool errors that happen behind the scenes
db.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

export default db;

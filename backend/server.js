import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pg from "pg";

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "foodmart",
  password: "okokoknour04",
  port: 5432,
});
db.connect();

// GET ALL STORE PRODUCTS
app.get("/api/storeProducts", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM store_products");
    res.status(200).json(result.rows); // RETURN ALL STORE PRODUCTS
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//GET ALL CART ITEMS
app.get("/api/cartItems", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM cart_items");
    res.status(200).json(result.rows); // RETURN ALL CART ITEMS
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

import express from "express"; 
import bodyParser from "body-parser"; 
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

const db = new pg.Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Connected to the database');
  }
});


// GET ALL STORE PRODUCTS
app.get("/api/storeProducts", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM store_products");
    res.status(200).json(result.rows); // RETURN ALL STORE PRODUCTS
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// GET ALL CART ITEMS
app.get("/api/cartItems", async (req, res) => {
  try {
    const result = await db.query(`SELECT 
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
        cart_items.product_id = store_products.product_id`);
    res.status(200).json(result.rows); // RETURN ALL CART ITEMS
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// POST NEW CART ITEM OR UPDATE IF EXISTS
app.post("/api/cartItems", async (req, res) => {
  const { product_id, item_quantity, total_item_price } = req.body;
  try {
    const existingItem = await db.query(
      "SELECT * FROM cart_items WHERE product_id = $1",
      [product_id]
    );

    if (existingItem.rows.length > 0) {
      const currentQuantity = parseInt(existingItem.rows[0].item_quantity, 10);
      const currentTotalPrice = parseFloat(
        existingItem.rows[0].total_item_price
      );
      const new_item_quantity = currentQuantity + item_quantity;
      const new_total_item_price = currentTotalPrice + total_item_price;

      // Update the existing item
      await db.query(
        "UPDATE cart_items SET item_quantity = $1, total_item_price = $2 WHERE product_id = $3",
        [new_item_quantity, new_total_item_price, product_id]
      );
    }
    // Add new item if no existing item with same id
    else {
      await db.query(
        "INSERT INTO cart_items (product_id, item_quantity, total_item_price) VALUES($1, $2, $3)",
        [product_id, item_quantity, total_item_price]
      );
    }
  } catch (error) {
    console.log(error);
  }
});

// DELETE CART ITEM
app.delete("/api/cartItems/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM cart_items WHERE product_id = $1", [id]);
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

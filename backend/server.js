import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import recommendationsRouter from "./routes/recommendations.js";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

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
    console.error("Error connecting to the database:", err.stack);
  } else {
    console.log("Connected to the database");
  }
});

// REGISTER
app.post("/api/register", async (req, res) => {
  const { email, password, name, role } = req.body;

  // Basic validation
  if (!email || !password || !name || !role) {
    return res
      .status(400)
      .json({ message: "Name, email, password and role are required" });
  }

  try {
    // Check if user already exists
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING user_id, email, name, role",
      [email, hashedPassword, name, role]
    );

    const user = result.rows[0];

    res.status(200).json({
      message: "User registered successfully",
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(401).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (isMatch && role === user.role) {
      res.status(200).json({
        message: "Login successful",
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
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
app.get("/api/cartItems/:user_id", async (req, res) => {
  const { user_id } = req.params;

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
      [user_id]
    );
    res.status(200).json(result.rows); // RETURN ALL CART ITEMS
  } catch (error) {
    res.status(500).json({ message: "Cart fetch error", error: error.message });
  }
});

// POST NEW CART ITEM OR UPDATE IF EXISTS
app.post("/api/cartItems", async (req, res) => {
  const { user_id, product_id, item_quantity, total_item_price } = req.body;
  try {
    const existingItem = await db.query(
      "SELECT * FROM cart_items WHERE product_id = $1 AND user_id = $2",
      [product_id, user_id]
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
        "UPDATE cart_items SET item_quantity = $1, total_item_price = $2 WHERE product_id = $3 AND user_id = $4",
        [new_item_quantity, new_total_item_price, product_id, user_id]
      );
    }
    // Add new item if no existing item with same id
    else {
      await db.query(
        "INSERT INTO cart_items (user_id, product_id, item_quantity, total_item_price) VALUES($1, $2, $3, $4)",
        [user_id, product_id, item_quantity, total_item_price]
      );
    }

    res.status(200).json({ message: "Cart updated" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Cart update error", error: error.message });
  }
});

// DELETE CART ITEM
app.delete("/api/cartItems/:user_id/:product_id", async (req, res) => {
  const { user_id, product_id } = req.params;
  try {
    await db.query(
      "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2",
      [user_id, product_id]
    );
    res.status(200).json({ message: "Item removed" });
  } catch (error) {
    res.status(500).json({ message: "Delete error", error: error.message });
  }
});

// ADD NEW PRODUCT (Admin Only)
app.post("/api/storeProducts", async (req, res) => {
  const {
    product_name,
    product_description,
    product_price,
    product_category,
    product_img,
  } = req.body;

  console.log("Adding new product:", product_name);
  console.log("Category:", product_category);
  console.log("Price:", product_price);

  // Basic validation
  if (
    !product_name ||
    !product_img ||
    !product_price ||
    !product_category ||
    !product_description
  ) {
    return res.status(400).json({
      message:
        "Product name, image, category, description and price are required",
    });
  }

  try {
    const result = await db.query(
      "INSERT INTO store_products (product_name, product_description, product_img, product_price, product_category) VALUES ($1, $2, $3, $4, $5) RETURNING product_id, product_name, product_description, product_img, product_price, product_category",
      [
        product_name,
        product_description,
        product_img,
        product_price,
        product_category,
      ]
    );

    const newProduct = result.rows[0];

    // Update recommendations after adding new product
    console.log("Product added successfully, updating recommendations...");
    try {
      await updateRecommendations();
      console.log("Successfully updated recommendations");
    } catch (recError) {
      console.error("Failed to update recommendations:", recError);
      // Don't fail the request if recommendations update fails
    }

    res.status(201).json({
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Product addition error:", error);
    res.status(500).json({
      message: "Product addition failed",
      error: error.message,
    });
  }
});

// UPDATE PRODUCT (Admin Only)
app.put("/api/storeProducts/:product_id", async (req, res) => {
  const { product_id } = req.params;
  const {
    product_name,
    product_description,
    product_img,
    product_price,
    product_category,
  } = req.body;

  // Basic validation
  if (
    !product_name ||
    !product_description ||
    !product_img ||
    !product_price ||
    !product_category
  ) {
    return res.status(400).json({
      message:
        "Product name, description, image, price, and category are required",
    });
  }

  try {
    const result = await db.query(
      "UPDATE store_products SET product_name = $1, product_description = $2, product_img = $3, product_price = $4, product_category = $5 WHERE product_id = $6 RETURNING product_id, product_name, product_description, product_img, product_price, product_category",
      [
        product_name,
        product_description,
        product_img,
        product_price,
        product_category,
        product_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = result.rows[0];

    // Update recommendations after updating product
    try {
      await updateRecommendations();
      console.log("Successfully updated recommendations");
    } catch (recError) {
      console.error("Failed to update recommendations:", recError);
      // Don't fail the request if recommendations update fails
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Product update error:", error);
    res.status(500).json({
      message: "Product update failed",
      error: error.message,
    });
  }
});

// DELETE PRODUCT (Admin Only)
app.delete("/api/storeProducts/:product_id", async (req, res) => {
  const { product_id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM store_products WHERE product_id = $1 RETURNING product_id",
      [product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update recommendations after deleting product
    try {
      await updateRecommendations();
      console.log("Successfully updated recommendations");
    } catch (recError) {
      console.error("Failed to update recommendations:", recError);
      // Don't fail the request if recommendations update fails
    }

    res.status(200).json({
      message: "Product deleted successfully",
      product_id: product_id,
    });
  } catch (error) {
    console.error("Product deletion error:", error);
    res.status(500).json({
      message: "Product deletion failed",
      error: error.message,
    });
  }
});

// Add recommendations route
app.use("/api/recommendations", recommendationsRouter);

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run Python script
const updateRecommendations = () => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      __dirname,
      "scripts",
      "calculate_recommendations.py"
    );

    // Using Windows CMD syntax
    const command = `cd "${path.dirname(
      __dirname
    )}" && .venv\\Scripts\\activate.bat && cd backend\\scripts && python calculate_recommendations.py`;

    console.log("Attempting to run Python script with command:", command);
    console.log("Current directory:", __dirname);
    console.log("Parent directory:", path.dirname(__dirname));

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error running Python script:", error);
        console.error("Error details:", error.message);
        console.error("Error code:", error.code);
        reject(error);
        return;
      }
      if (stderr) {
        console.error("Python script stderr:", stderr);
      }
      console.log("Python script output:", stdout);
      resolve();
    });
  });
};

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

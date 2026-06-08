import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import { setAuthCookie, clearAuthCookie } from "../utils/authHelpers.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  const role = "customer";

  // Basic validation
  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
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
      [email, hashedPassword, name, role],
    );

    const user = result.rows[0];
    setAuthCookie(res, user);

    res.status(201).json({
      message: "User registered successfully",
      user,
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
router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (isMatch && (!role || role === user.role)) {
      const authUser = {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      setAuthCookie(res, authUser);

      res.status(200).json({
        message: "Login successful",
        user: authUser,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: "Logged out successfully" });
});

// GET CURRENT USER
router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;
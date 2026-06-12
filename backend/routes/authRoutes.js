import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import { setAuthCookie, clearAuthCookie } from "../utils/authHelpers.js";
import { authenticateToken } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import { loginSchema, registerSchema } from "../zodSchemas/authSchemas.js";

import { validate } from "../middleware/validate.js";

const router = express.Router();

// AUTH LIMITER
// stricter limiter for auth actions (10 attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: {
    message: "Too many authentication attempts, please try again later.",
  },
});

// REGISTER
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    const { email, password, name } = req.body;
    const role = "customer";

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
      next(error);
    }
  },
);

// LOGIN
router.post("/login", authLimiter, validate(loginSchema), async (req, res, next) => {
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
      res.status(401).json({ message: "Invalid email or password" }); // not 'email not found' to prevent email enumeration
    }
  } catch (error) {
    next(error);
  }
});

// LOGOUT
// no rate limit needed here
router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: "Logged out successfully" });
});

// GET CURRENT USER
router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;

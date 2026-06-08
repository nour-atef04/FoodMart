import jwt from "jsonwebtoken";
import db from "../config/db.js";
import {
  readCookie,
  clearAuthCookie,
  COOKIE_NAME,
} from "../utils/authHelpers.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const token = readCookie(req, COOKIE_NAME);
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query(
      "SELECT user_id, email, name, role FROM users WHERE user_id = $1",
      [decoded.user_id],
    );

    if (result.rows.length === 0) {
      clearAuthCookie(res);
      return res.status(401).json({ message: "Authentication required" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    clearAuthCookie(res);
    return res.status(401).json({ message: "Authentication required" });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to access this resource" });
    }

    return next();
  };
};

import jwt from "jsonwebtoken";
import {
  clearAuthCookie,
  COOKIE_NAME,
} from "../utils/authHelpers.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decodedPayload;

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

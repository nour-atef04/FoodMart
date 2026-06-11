import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet"; // to secure the app from web vulnerabilities
import rateLimit from "express-rate-limit"; // for rate limiting endpoints

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import recommendationsRouter from "./routes/recommendations.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// Rate limiters (global limiter -> 100 requests per 15 mins)
// a stricter one is written in authRoutes.js
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // disable the `X-RateLimit-*` headers
});

// Global Middleware
app.use(helmet());
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

// Apply the global limiter to all /api routes
app.use("/api", globalLimiter);

// API Routes
app.use("/api", authRoutes);
app.use("/api", cartRoutes);
app.use("/api/storeProducts", productRoutes);
app.use("/api/recommendations", recommendationsRouter);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

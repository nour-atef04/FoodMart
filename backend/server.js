import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet"; // to secure the app from web vulnerabilities
import rateLimit from "express-rate-limit"; // for rate limiting endpoints
import compression from "compression"; // for compression of payloads sent over the network
import pinoHttp from "pino-http"; // request logger

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import recommendationsRouter from "./routes/recommendationsRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// Rate limiters (global limiter -> 100 requests per 15 mins)
// a stricter one is written in authRoutes.js
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // disable the `X-RateLimit-*` headers
});

// Global Middleware

// This automatically attaches a unique request ID to every incoming call
app.use(
  pinoHttp({
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  }),
);

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(compression());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// Apply the global limiter to all /api routes
app.use("/api", globalLimiter);

// API Routes
app.use("/api", authRoutes);
app.use("/api", cartRoutes);
app.use("/api/storeProducts", productRoutes);
app.use("/api/recommendations", recommendationsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  // use the pino logger to log the exact error and request ID
  req.log.error({ err }, "Unhandled API Error");

  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    // only send the raw stack trace to the frontend if we are in development mode
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

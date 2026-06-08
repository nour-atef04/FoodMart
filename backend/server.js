import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import recommendationsRouter from "./routes/recommendations.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// Global Middleware
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

// API Routes
app.use("/api", authRoutes);
app.use("/api", cartRoutes);
app.use("/api/storeProducts", productRoutes);
app.use("/api/recommendations", recommendationsRouter);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

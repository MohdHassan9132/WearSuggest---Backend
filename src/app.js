// import dotenv from "dotenv";
// dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRoutes from "./routes/user.routes.js";
import clothingRoutes from "./routes/clothing.routes.js";
import outfitRoutes from "./routes/outfit.routes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/clothing", clothingRoutes);
app.use("/api/v1/outfit", outfitRoutes);

export { app };

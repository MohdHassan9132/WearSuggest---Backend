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

app.get("/",(req,res)=>{
    res.json({
        status: 200,
        message: "App is running"
    })
})

import userRoutes from "./routes/user.routes.js";
import clothingRoutes from "./routes/clothing.routes.js";
import outfitRoutes from "./routes/outfit.routes.js";
import virtualTryOnRoutes from './routes/virtualTryOn.routes.js'
import sellerRoutes from "./routes/seller.routes.js";
import productRoutes from "./routes/product.routes.js";
import fitRoutes from './routes/fit.routes.js'

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/sellers", sellerRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/clothing", clothingRoutes);
app.use("/api/v1/outfit", outfitRoutes);
app.use("/api/v1/virtual-try-on", virtualTryOnRoutes);
app.use("/api/v1/fits",fitRoutes)

export { app };

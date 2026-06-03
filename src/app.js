import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { corsOptions }
from "./config/cors.js";

import { env }
from "./config/env.js";

const app = express();

app.use(cors(corsOptions));

console.log(corsOptions.origin);
console.log(env.NODE_ENV);





/*
|--------------------------------------------------------------------------
| WEBHOOK ROUTES
|--------------------------------------------------------------------------
| Must come BEFORE express.json()
| because Razorpay needs raw body
|--------------------------------------------------------------------------
*/

import {
    verifyWebhook
}
from "./controllers/subscription.controller.js";

app.post(
    "/api/v1/subscription/webhook",

    express.raw({
        type: "application/json"
    }),

    verifyWebhook
);





/*
|--------------------------------------------------------------------------
| NORMAL MIDDLEWARES
|--------------------------------------------------------------------------
*/

app.use(express.json({
    limit: "16kb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.static("public"));

app.use(cookieParser());





/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {

    res.json({
        status: 200,
        message: "App is running"
    });
});





/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

import userRoutes
from "./routes/user.routes.js";

import clothingRoutes
from "./routes/clothing.routes.js";

import outfitRoutes
from "./routes/outfit.routes.js";

import virtualTryOnRoutes
from "./routes/virtualTryOn.routes.js";

import sellerRoutes
from "./routes/seller.routes.js";

import productRoutes
from "./routes/product.routes.js";

import fitRoutes
from "./routes/fit.routes.js";

import postRouter
from "./routes/post.routes.js";

import subscriptionRoutes
from "./routes/subscription.routes.js";

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/sellers", sellerRoutes);

app.use("/api/v1/products", productRoutes);

app.use("/api/v1/post", postRouter);

app.use("/api/v1/clothing", clothingRoutes);

app.use("/api/v1/outfit", outfitRoutes);

app.use(
    "/api/v1/virtual-try-on",
    virtualTryOnRoutes
);

app.use("/api/v1/fits", fitRoutes);

app.use(
    "/api/v1/subscription",
    subscriptionRoutes
);

export { app };
import express from "express";

import {
    createSubscriptionOrder,
    getCurrentPlan,
    verifyFrontendPayment,
}
from "../controllers/sellerSubscription.controller.js";

import { JWTVerify }
from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/create",
    JWTVerify,
    createSubscriptionOrder
);

router.post(
    "/verify",
    JWTVerify,
    verifyFrontendPayment
);

router.get(
    "/current",
    JWTVerify,
    getCurrentPlan
)
export default router;
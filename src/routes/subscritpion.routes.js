import express from "express";

import {
    createSubscriptionOrder,
    verifyFrontendPayment,
    verifyWebhook
}
from "../controllers/subscription.controller.js";

import { verifyJWT }
from "../middlewares/verifyJWT.js";

const router = express.Router();

router.post(
    "/create",
    verifyJWT,
    createSubscriptionOrder
);

router.post(
    "/verify",
    verifyJWT,
    verifyFrontendPayment
);

export default router;
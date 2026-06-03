import { asyncHandler }
from "../utils/asyncHandler.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { subscriptionService }
from "../services/subscription/subscription.service.js";

export const createSubscriptionOrder =
asyncHandler(async (req, res) => {

    const result =
        await subscriptionService
        .createSubscriptionOrder({

            subscriberId: req.user._id,

            role: req.user.role,

            plan: req.body.plan
        });

    return res.status(201).json(
        new ApiResponse(
            201,
            result,
            "Subscription order created"
        )
    );
});

export const verifyFrontendPayment =
asyncHandler(async (req, res) => {

    await subscriptionService
        .verifyFrontendPayment(req.body);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Payment verified"
        )
    );
});

export const verifyWebhook =
asyncHandler(async (req, res) => {

    await subscriptionService
        .verifyWebhook(req);

    return res.status(200).json({
        success: true
    });
});
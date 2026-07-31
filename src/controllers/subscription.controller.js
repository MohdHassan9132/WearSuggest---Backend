import { asyncHandler }
from "../utils/AsyncHandler.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { subscriptionService }
from "../services/subscription/subscription.service.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

export const createSubscriptionOrder =
asyncHandler(async (req, res) => {

    const result =
        await subscriptionService
        .createSubscriptionOrder({

            subscriberId: req.user._id,

            role: req.auth.role,

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

export const getCurrentPlan = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    if(!userId || !mongoose.isValidObjectId(userId)){
        throw new ApiError(400,"Invalid UserId")
    }
    const plan = await subscriptionService.getCurrentPlan(
        {
            role: req.auth.role,
            subscriberId: req.user._id
        }
    )
    return res.status(200).json(new ApiResponse(200,plan,"Current plan fetched successfully"))
})
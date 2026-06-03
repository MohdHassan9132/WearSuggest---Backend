import mongoose from "mongoose";
import { validateSubscriber } from "../validators/subscription.validator.js";

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
    },

    subscriberType: {
        type: String,
        enum: ["SELLER", "USER"],
        required: true
    },

    latestOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionOrder"
    },

    credits: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

subscriptionSchema.pre(
    "validate",
    validateSubscriber
);

subscriptionSchema.index(
    { userId: 1 },
    { unique: true, sparse: true }
);

subscriptionSchema.index(
    { sellerId: 1 },
    { unique: true, sparse: true }
);

export const Subscription = mongoose.model(
    "Subscription",
    subscriptionSchema
);


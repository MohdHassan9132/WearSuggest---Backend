import mongoose from "mongoose";
import { validateSubscriber } from "../validators/subscription.validator.js";

const subscriptionOrderSchema = new mongoose.Schema({
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
        enum: ["Seller", "User"],
        required: true
    },

    credits: {
        type: Number,
        required: true
    },

    tier: {
        type: String,
        required: true,
        enum: ["Tier1", "Tier2", "Tier3"]
    },

    paymentService: {
        type: String,
        enum: ["Razorpay", "Stripe"],
        required: true
    },

    paymentOrderId: {
        type: String,
        unique: true,
        sparse: true
    },

    paymentId: {
        type: String
    },

    amountPaid: {
        type: Number,
        required: true
    },

    paymentStatus: {
        type: String,
        enum: [
            "Pending",
            "Success",
            "Failed",
            "Refunded"
        ],
        default: "Pending"
    }

}, { timestamps: true });

subscriptionOrderSchema.pre(
    "validate",
    validateSubscriber
);

export const SubscriptionOrder = mongoose.model(
    "SubscriptionOrder",
    subscriptionOrderSchema
);


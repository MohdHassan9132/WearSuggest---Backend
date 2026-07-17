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
        enum: ["SELLER", "USER"],
        required: true
    },

    credits: {
        type: Number,
        required: true
    },

    plan: {
        type: String,
        required: true
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
        type: String,
        sparse: true
    },

    paymentSignature: {
        type: String
    },
    amount:{
        type: String,  
    },

    amountPaid: {
        type: Number,
        required: true
    },

    paymentStatus: {
        type: String,
        enum: [
            "created",
            "success",
            "failed",
            "refunded"
        ],
        default: "created"
    },

}, { timestamps: true });

subscriptionOrderSchema.pre(
    "validate",
    validateSubscriber
);

export const SubscriptionOrder = mongoose.model(
    "SubscriptionOrder",
    subscriptionOrderSchema
);


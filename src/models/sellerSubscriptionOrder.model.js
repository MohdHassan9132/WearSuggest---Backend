import mongoose from "mongoose";
import { validateSubscriber } from "../validators/subscription.validator.js";

const sellerSubscriptionOrderSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
    },
    credits: {
        type: Number,
        required: true
    },

    tier: {
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
    }

}, { timestamps: true });

export const SubscriptionOrder = mongoose.model(
    "SellerSubscriptionOrder",
    sellerSubscriptionOrderSchema
);


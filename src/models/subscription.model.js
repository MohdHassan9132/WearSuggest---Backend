import mongoose from "mongoose";
import { User } from "./user.model";

const subscriptionSchema = mongoose.Schema({
    isSubscribed: { type: Boolean, default: false },

    plan: {
        type: String,
        enum: ["WEEKLY", "MONTHLY", "YEARLY", null],
        default: null,
    },

    startedAt: Date,
    expiresOn: Date,
    amount: Number,
    userId: {
        ref: User,
        type: mongoose.Schema.Types.ObjectId,
    },
    usage: {
        totalTryOns: {
            type: Number,
            min: 0,
        },
        dailyTryOns: {
            type: Number,
            min: 0,
        },
        dailyResetAt: {
            type: Date,
        },
    },
});

export const Subscription = mongoose.Model("Subscription", subscriptionSchema);

import mongoose from "mongoose";
import { User } from "./user.model";

const subscriptionSchema = mongoose.Schema({
    subscription: {
        isSubscribed: { type: Boolean, default: false },

        plan: {
            type: String,
            enum: ["WEEKLY", "MONTHLY", "YEARLY", null],
            default: null,
        },

        startedAt: Date,
        expiresOn: Date,
        amount: Number,
    },
    usage: {
        tryOnCount: { type: Number, default: 0, min: 0 },
    },
    userId: {
        ref: User,
        type: mongoose.Schema.Types.ObjectId,
    },
});

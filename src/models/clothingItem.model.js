import mongoose, { Mongoose } from "mongoose";

const clothingItemSchema = new mongoose.Schema(
    {
        owner: {
            type: Mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        colour: {
            type: String,
            required: true,
        },
        category: {
            Enumerator: ["top", "bottom", "accessories"],
        },
        imageURL: {
            type: String,
            required: true,
        },
        imagePublicId: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const clothingItem = mongoose.model("clothingItem", clothingItemSchema);

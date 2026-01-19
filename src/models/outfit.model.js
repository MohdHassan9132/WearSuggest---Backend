import mongoose from "mongoose";

const outfitSchema = new mongoose.Schema(
    {
        top: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "clothingItem",
                required: true,
            },
        ],
        bottom: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "clothingItem",
                required: true,
            },
        ],
        accessories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "clothingItem",
            },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Outfit = mongoose.model("Outfit", outfitSchema);

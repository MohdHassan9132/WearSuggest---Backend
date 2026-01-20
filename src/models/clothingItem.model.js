import mongoose from "mongoose";

const clothingItemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["top", "bottom", "footwear", "outerwear", "accessory"],
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },

    colorGroup: {
      type: String,
      enum: ["neutral", "warm", "cool"],
      required: true,
      index: true,
    },

    season: {
      type: [{
        type: String,
        lowercase: true,
        enum: ["summer", "winter", "rainy"]
      }],
      required: true,
      index: true,
    },

    occasion: {
      type: [{
        type: String,
        lowercase: true,
        enum: ["casual", "formal", "party"]
      }],
      required: true,
      index: true,
    },

    // 🔒 IMAGE IS REQUIRED
    imageURL: {
      type: String,
      required: true,
    },

    imagePublicId: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

clothingItemSchema.index({ owner: 1, type: 1 });

export const ClothingItem = mongoose.model(
  "ClothingItem",
  clothingItemSchema
);

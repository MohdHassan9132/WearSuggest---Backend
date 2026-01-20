import mongoose from "mongoose";

const clothingItemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    category: {
      type: String,
      enum: ["top", "bottom", "accessory"],
      required: true,
      index: true
    },

    color: {
      type: String,
      required: true
    },

    colorTone: {
      type: String,
      enum: ["light", "dark", "neutral"],
      required: true,
      index: true
    },

    imageURL: String,
    imagePublicId: String
  },
  { timestamps: true }
);

clothingItemSchema.index({ owner: 1, category: 1 });

export default mongoose.model("ClothingItem", clothingItemSchema);

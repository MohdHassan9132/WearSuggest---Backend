import mongoose from "mongoose";

const outfitSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    top: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClothingItem",
      required: true
    },

    bottom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClothingItem",
      required: true
    },
    accessories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClothingItem"
      }
    ],
    
    lastWornAt: {
      type: Date,
      index: true
    }
  },
  { timestamps: true }
);

// ONLY enforce uniqueness on top + bottom
outfitSchema.index(
  { owner: 1, top: 1, bottom: 1 },
  { unique: true }
);

export default mongoose.model("Outfit", outfitSchema);

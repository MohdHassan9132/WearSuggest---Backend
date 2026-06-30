import mongoose from "mongoose";

const virtualTryOnSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

     cloth1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClothingItem",
    },

    cloth2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClothingItem",
    },

    cloth3: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClothingItem",
    },

    virtualTryOnImage: {
      type: {
        url: String,
        publicId: String
      },
      required: true
    },

  },
  { timestamps: true }
);

export const VirtualTryOn = mongoose.model("VirtualTryOn", virtualTryOnSchema);

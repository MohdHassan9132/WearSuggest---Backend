import mongoose from "mongoose";

const virtualTryOnSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    humanImage: {
      type: String, // Cloudinary URL or Base64
      required: true,
    },

    clothImage: {
      type: String, // Clothing image URL
      required: true,
    },

    taskId: {
      type: String, // From Kling API
    },

    externalTaskId: {
      type: String,
      unique: true,
    },

    status: {
      type: String,
      enum: ["submitted", "processing", "succeed", "failed"],
      default: "submitted",
    },

    resultImage: {
      type: String, // final try-on image URL
    },

    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

export const VirtualTryOn = mongoose.model("VirtualTryOn", virtualTryOnSchema);
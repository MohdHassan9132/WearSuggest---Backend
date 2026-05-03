import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
{
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: ["footwear", "upper", "lower", "outerwear"],
    required: true,
    index: true
  },

  category: {
    type: String, // jeans, hoodie, etc
    required: true
  },

  fitData: {
    fitType: {
      type: String,
      enum: ["slim", "regular", "loose", "oversized"],
      default: "regular"
    },

    upper: {
      chest: Number,
      waist: Number,
      shoulder: Number,
      sleeveLength: Number,
      length: Number,
    },

    lower: {
      waist: Number,
      thigh: Number,
      length: Number,
    },

    footwear: {
      region: {
        type: String,
        enum:["Indian","UK","US"]
      },
      size: Number
    }
  },

  imageURL: {
    type: String,
    required: false
  },

  imagePublicId: {
    type: String,
    required: false
  },

  isActive: {
    type: Boolean,
    default: true
  }

},
{ timestamps: true, strict: true }
);

productSchema.pre("validate", function (next) {
  const { type, fitData } = this;

  if (!fitData) return next();

  const hasUpper =
    fitData.upper &&
    Object.values(fitData.upper).some(v => v !== undefined && v !== null);

  const hasLower =
    fitData.lower &&
    Object.values(fitData.lower).some(v => v !== undefined && v !== null);

  const hasFootwear =
    fitData.footwear &&
    fitData.footwear.size !== undefined &&
    fitData.footwear.size !== null;

  const filledSections = [hasUpper, hasLower, hasFootwear].filter(Boolean).length;

  if (filledSections > 1) {
    return next(
      new Error("Only one of fitData.upper, fitData.lower, or fitData.footwear can be filled")
    );
  }

  if (type === "upper") {
    if (!hasUpper) {
      return next(
        new Error(
          "For type 'upper', only fitData.upper with chest, waist, shoulder, sleeveLength, and length is allowed"
        )
      );
    }

    fitData.lower = undefined;
    fitData.footwear = undefined;
  }

  if (type === "outerwear") {
  if (!hasUpper) {
    return next(
      new Error(
        "For type 'outerwear', fitData.upper with chest, waist, shoulder, sleeveLength, and length is required"
      )
    );
  }

  fitData.lower = undefined;
  fitData.footwear = undefined;
}

  if (type === "lower") {
    if (!hasLower) {
      return next(
        new Error(
          "For type 'lower', only fitData.lower with waist, thigh, and length is allowed"
        )
      );
    }

    fitData.upper = undefined;
    fitData.footwear = undefined;
  }

  if (type === "footwear") {
    if (!hasFootwear) {
      return next(
        new Error(
          "For type 'footwear', only fitData.footwear.size is allowed"
        )
      );
    }

    fitData.upper = undefined;
    fitData.lower = undefined;
  }
  next
});

export const Product = mongoose.model("Product",productSchema)
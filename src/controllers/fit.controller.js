import mongoose from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { toEU } from "../utils/fit/footwearConverter.js";
import { LOWER_EASE_RANGES, LOWER_WEIGHTS,UPPER_EASE_RANGES, UPPER_WEIGHTS,OUTERWEAR_EASE_RANGES } from "../utils/fit/fitRules.js";
import { calculateFit } from "../utils/fit/calculateFit.js";
import { buildFitSummary } from "../utils/fit/buildFitSummary.js";




const getFootwearFitLabel = (score) => {
    if (score === 100) return "Perfect Fit";
    if (score === 80) return "Good Fit";
    if (score === 40) return "Risky Fit";
    return "Will Not Fit";
};

const predictFootwearFit = asyncHandler(async (req, res) => {
    const { productId, userMeasurements } = req.body;

    if (!productId) throw new ApiError(400, "productId is required");
    if (!userMeasurements?.footwear) throw new ApiError(400, "userMeasurements.footwear is required");

    const { region: userRegion, size: userSize } = userMeasurements.footwear;

    if (!userRegion || userSize == null) {
        throw new ApiError(400, "userMeasurements.footwear must include region and size");
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findOne({ _id: productId, isActive: true });

    if (!product) throw new ApiError(404, "Product not found");
    if (product.type !== "footwear") throw new ApiError(400, "Product is not of type 'footwear'");
    if (!product.fitData?.footwear?.size) throw new ApiError(400, "Product is missing fitData.footwear");

    const { region: productRegion, size: productSize } = product.fitData.footwear;

    const productEU = toEU(productRegion, productSize);
    const userEU = toEU(userRegion, userSize);

    if (productEU == null) throw new ApiError(400, `Unsupported product footwear region: ${productRegion}`);
    if (userEU == null) throw new ApiError(400, `Unsupported user footwear region: ${userRegion}`);

    const sizeDifference = Math.abs(productEU - userEU);

    let fitScore;
    if (sizeDifference === 0) fitScore = 100;
    else if (sizeDifference <= 0.5) fitScore = 80;
    else if (sizeDifference <= 1) fitScore = 40;
    else fitScore = 0;

    const fitLabel = getFootwearFitLabel(fitScore);
    const issues = sizeDifference > 0
        ? [productEU < userEU ? `shoe too small by ${sizeDifference} EU size` : `shoe too large by ${sizeDifference} EU size`]
        : [];

    const summary = fitScore === 100
        ? "The footwear should fit exactly as intended."
        : fitScore === 80
            ? "The footwear should fit well with minimal difference."
            : fitScore === 40
                ? "The footwear may fit but there is a noticeable size difference — try before buying."
                : "The footwear is unlikely to fit.";

    const details = {
        size: {
            user: userEU,
            garment: productEU,
            difference: productEU - userEU,
            score: fitScore,
            status: fitScore === 100 ? "perfect" : fitScore === 80 ? "slightly off" : fitScore === 40 ? "risky" : "will not fit",
            issue: issues[0] ?? null,
        },
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { fitScore, fitLabel, summary, issues, details },
                "Fit prediction generated successfully"
            )
        );
});


const predictLowerFit = asyncHandler(async (req, res) => {
    const { productId, userMeasurements } = req.body;

    if (!productId) throw new ApiError(400, "productId is required");
    if (!userMeasurements?.lower) throw new ApiError(400, "userMeasurements.lower is required");

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findOne({ _id: productId, isActive: true });

    if (!product) throw new ApiError(404, "Product not found");
    if (product.type !== "lower") throw new ApiError(400, "Product is not of type 'lower'");
    if (!product.fitData?.lower) throw new ApiError(400, "Product is missing fitData.lower");

    const fitType = product.fitData.fitType || "regular";
    const easeRanges = LOWER_EASE_RANGES[fitType];

    if (!easeRanges) throw new ApiError(400, `Invalid fitType '${fitType}' on product`);

    const { fitScore, fitLabel, issues, details } = calculateFit(
        product.fitData.lower,
        userMeasurements.lower,
        easeRanges,
        LOWER_WEIGHTS
    );

   const summary = buildFitSummary({
    fitScore,
    issues,
    type: "lower",
    fitType,
});

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { fitScore, fitLabel, summary, issues, details },
                "Fit prediction generated successfully"
            )
        );
});

const predictOuterwearFit = asyncHandler(async (req, res) => {
    const { productId, userMeasurements } = req.body;

    if (!productId) throw new ApiError(400, "productId is required");
    if (!userMeasurements?.upper) throw new ApiError(400, "userMeasurements.upper is required");

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findOne({ _id: productId, isActive: true });

    if (!product) throw new ApiError(404, "Product not found");
    if (product.type !== "outerwear") throw new ApiError(400, "Product is not of type 'outerwear'");
    if (!product.fitData?.upper) throw new ApiError(400, "Product is missing fitData.upper");

    const fitType = product.fitData.fitType || "regular";
    const easeRanges = OUTERWEAR_EASE_RANGES[fitType];

    if (!easeRanges) throw new ApiError(400, `Invalid fitType '${fitType}' on product`);

    const { fitScore, fitLabel, issues, details } = calculateFit(
        product.fitData.upper,
        userMeasurements.upper,
        easeRanges,
        UPPER_WEIGHTS
    );

    const summary = buildFitSummary({
    fitScore,
    issues,
    type: "outerwear",
    fitType,
});

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { fitScore, fitLabel, summary, issues, details },
                "Fit prediction generated successfully"
            )
        );
});


const predictUpperFit = asyncHandler(async (req, res) => {
    const { productId, userMeasurements } = req.body;

    if (!productId) throw new ApiError(400, "productId is required");
    if (!userMeasurements?.upper) throw new ApiError(400, "userMeasurements.upper is required");

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findOne({ _id: productId, isActive: true });

    if (!product) throw new ApiError(404, "Product not found");
    if (product.type !== "upper") throw new ApiError(400, "Product is not of type 'upper'");
    if (!product.fitData?.upper) throw new ApiError(400, "Product is missing fitData.upper");

    const fitType = product.fitData.fitType || "regular";
    const easeRanges = UPPER_EASE_RANGES[fitType];

    if (!easeRanges) throw new ApiError(400, `Invalid fitType '${fitType}' on product`);

    const { fitScore, fitLabel, issues, details } = calculateFit(
        product.fitData.upper,
        userMeasurements.upper,
        easeRanges,
        UPPER_WEIGHTS
    );

    const summary = buildFitSummary({
    fitScore,
    issues,
    type: "upper",
    fitType,
});

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { fitScore, fitLabel, summary, issues, details },
                "Fit prediction generated successfully"
            )
        );
});

export { predictFootwearFit,predictLowerFit,predictOuterwearFit,predictUpperFit };

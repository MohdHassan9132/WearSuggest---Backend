import mongoose from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { toEU } from "../utils/fit/footwearConverter.js";
import {
    LOWER_EASE_RANGES,
    LOWER_WEIGHTS,
    UPPER_EASE_RANGES,
    UPPER_WEIGHTS,
    OUTERWEAR_EASE_RANGES,
} from "../utils/fit/fitRules.js";
import { calculateFit } from "../utils/fit/calculateFit.js";
import { formatFitResponse } from "../utils/fit/formatFitResponse.js";

const buildFormattedResponse = ({ productId, fitScore, fitType, shortReason, details }) => {
    return {
        productId,
        fit: formatFitResponse({
            fitScore,
            fitType,
            shortReason,
            details,
        }),
    };
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

    const sizeDifference = productEU - userEU;
    const absSizeDifference = Math.abs(sizeDifference);

    let fitScore;
    let fitType;

    if (sizeDifference < 0) {
        fitScore = 40;
        fitType = "bad";
    } else if (absSizeDifference === 0) {
        fitScore = 98;
        fitType = "perfect";
    } else if (sizeDifference > 0 && absSizeDifference <= 0.5) {
        fitScore = 88;
        fitType = "good";
    } else if (sizeDifference > 0 && absSizeDifference <= 1) {
        fitScore = 80;
        fitType = "good";
    } else {
        fitScore = 50;
        fitType = "bad";
    }

    const issues = absSizeDifference > 0
        ? [productEU < userEU ? `shoe too small by ${absSizeDifference} EU size` : `shoe too large by ${absSizeDifference} EU size`]
        : [];
    const shortReason = issues[0] ?? "Well balanced fit";

    const details = {
        size: {
            user: userEU,
            garment: productEU,
            difference: sizeDifference,
            score: fitScore,
            status: fitType === "perfect" ? "perfect" : productEU < userEU ? "too tight" : "too loose",
            issue: issues[0] ?? null,
        },
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                buildFormattedResponse({ productId, fitScore, fitType, shortReason, details }),
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

    const productFitType = product.fitData.fitType || "regular";
    const easeRanges = LOWER_EASE_RANGES[productFitType];

    if (!easeRanges) throw new ApiError(400, `Invalid fitType '${productFitType}' on product`);

    const { fitScore, details, fitType, shortReason } = calculateFit(
        product.fitData.lower,
        userMeasurements.lower,
        easeRanges,
        LOWER_WEIGHTS,
        "lower"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                buildFormattedResponse({ productId, fitScore, fitType, shortReason, details }),
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

    const productFitType = product.fitData.fitType || "regular";
    const easeRanges = OUTERWEAR_EASE_RANGES[productFitType];

    if (!easeRanges) throw new ApiError(400, `Invalid fitType '${productFitType}' on product`);

    const { fitScore, details, fitType, shortReason } = calculateFit(
        product.fitData.upper,
        userMeasurements.upper,
        easeRanges,
        UPPER_WEIGHTS,
        "outerwear"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                buildFormattedResponse({ productId, fitScore, fitType, shortReason, details }),
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

    const productFitType = product.fitData.fitType || "regular";
    const easeRanges = UPPER_EASE_RANGES[productFitType];

    if (!easeRanges) throw new ApiError(400, `Invalid fitType '${productFitType}' on product`);

    const { fitScore, details, fitType, shortReason } = calculateFit(
        product.fitData.upper,
        userMeasurements.upper,
        easeRanges,
        UPPER_WEIGHTS,
        "upper"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                buildFormattedResponse({ productId, fitScore, fitType, shortReason, details }),
                "Fit prediction generated successfully"
            )
        );
});

export { predictFootwearFit, predictLowerFit, predictOuterwearFit, predictUpperFit };

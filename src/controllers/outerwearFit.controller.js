import mongoose from "mongoose";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Product } from "../../models/product.model.js";
import { UPPER_EASE_RANGES, UPPER_WEIGHTS } from "../../utils/fit/fitRules.js";
import { calculateFit } from "../../utils/fit/calculateFit.js";
import { buildFitSummary } from "../../utils/fit/buildFitSummary.js";

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
    const easeRanges = UPPER_EASE_RANGES[fitType];

    if (!easeRanges) throw new ApiError(400, `Invalid fitType '${fitType}' on product`);

    const { fitScore, fitLabel, issues, details } = calculateFit(
        product.fitData.upper,
        userMeasurements.upper,
        easeRanges,
        UPPER_WEIGHTS
    );

    const summary = buildFitSummary(fitScore, issues);

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

export { predictOuterwearFit };

import mongoose from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    getInstagramPostStatusById,
    startInstagramPublishJob,
} from "../services/outfit/instagram/instagramPublishing.service.js";

const publishInstagramPost = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { caption } = req.body;
    const seller = req.user;

    if (!seller) {
        throw new ApiError(401, "Seller not found");
    }

    if (!caption || caption.trim() === "") {
        throw new ApiError(400, "Caption is required");
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const job = await startInstagramPublishJob({
        seller,
        productId,
        caption,
    });

    return res
        .status(202)
        .json(new ApiResponse(202, job, "Instagram publish job started"));
});

const getInstagramPostStatus = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const seller = req.user;

    if (!seller) {
        throw new ApiError(401, "Seller not found");
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError(400, "Invalid post id");
    }

    const status = await getInstagramPostStatusById({
        postId,
        sellerId: seller._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, status, "Instagram post status fetched"));
});

export { getInstagramPostStatus, publishInstagramPost };

import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createImageContainer } from "../services/instagram/createImageContainer.js";
import { createCarouselContainer } from "../services/instagram/createCarouselContainer.js";
import { publishContainer } from "../services/instagram/publishContainer.js";

const getInstagramErrorMessage = (error) => {
    return (
        error?.response?.data?.error?.message ||
        error?.response?.data?.error_message ||
        error?.message ||
        "Instagram publishing failed"
    );
};

const extractProductImages = (product) => {
    const productImages =
        product?.media?.productImages?.map((image) => image?.url) || [];
    const aiModelPreview = product?.media?.aiModelPreview?.url;

    return [...productImages, aiModelPreview].filter(Boolean);
};

const validateInstagramImageUrl = (imageUrl) => {
    let parsedUrl;

    try {
        parsedUrl = new URL(imageUrl);
    } catch (error) {
        throw new ApiError(400, "All product images must be valid public HTTPS URLs");
    }

    if (parsedUrl.protocol !== "https:") {
        throw new ApiError(400, "All product images must be valid public HTTPS URLs");
    }

    const pathname = parsedUrl.pathname.toLowerCase();

    if (!pathname.endsWith(".jpg") && !pathname.endsWith(".jpeg")) {
        throw new ApiError(400, "Only JPG and JPEG images can be published to Instagram");
    }
};

const createFailedPost = async ({ sellerId, caption, errorMessage }) => {
    if (!sellerId || !caption?.trim()) {
        return null;
    }

    try {
        return await Post.create({
            sellerId,
            caption: caption.trim(),
            status: "failed",
            errorMessage,
            type: "single",
        });
    } catch (error) {
        console.error("Failed to save failed Instagram post:", error.message);
        return null;
    }
};

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

    try {
        if (!seller.instagramConnected) {
            throw new ApiError(400, "Instagram account is not connected");
        }

        if (!seller.igAccessToken || !seller.instagramId) {
            throw new ApiError(400, "Instagram access token is missing");
        }

        const product = await Product.findById(productId);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        if (String(product.seller) !== String(seller._id)) {
            throw new ApiError(403, "You are not authorized to publish this product");
        }

        const imageUrls = extractProductImages(product);

        if (!imageUrls.length) {
            throw new ApiError(400, "Product has no images to publish");
        }

        if (imageUrls.length > 6) {
            throw new ApiError(400, "Instagram carousel supports a maximum of 6 images for this product");
        }

        imageUrls.forEach(validateInstagramImageUrl);

        const trimmedCaption = caption.trim();
        const isSingleImagePost = imageUrls.length === 1;

        let instagramContainerId;

        if (isSingleImagePost) {
            instagramContainerId = await createImageContainer({
                igUserId: seller.instagramId,
                accessToken: seller.igAccessToken,
                imageUrl: imageUrls[0],
                caption: trimmedCaption,
            });
        } else {
            const childContainerIds = await Promise.all(
                imageUrls.map((imageUrl) =>
                    createImageContainer({
                        igUserId: seller.instagramId,
                        accessToken: seller.igAccessToken,
                        imageUrl,
                        isCarouselItem: true,
                    })
                )
            );

            instagramContainerId = await createCarouselContainer({
                igUserId: seller.instagramId,
                accessToken: seller.igAccessToken,
                children: childContainerIds,
                caption: trimmedCaption,
            });
        }

        const instagramMediaId = await publishContainer({
            igUserId: seller.instagramId,
            accessToken: seller.igAccessToken,
            creationId: instagramContainerId,
        });

        const post = await Post.create({
            sellerId: seller._id,
            type: isSingleImagePost ? "single" : "carousel",
            caption: trimmedCaption,
            instagramContainerId,
            instagramMediaId,
            status: "published",
            publishedAt: new Date(),
        });

        return res
            .status(201)
            .json(
                new ApiResponse(201, post, "Instagram post published successfully")
            );
    } catch (error) {
        const errorMessage =
            error instanceof ApiError
                ? error.message
                : getInstagramErrorMessage(error);

        await createFailedPost({
            sellerId: seller?._id,
            caption,
            errorMessage,
        });

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(502, errorMessage);
    }
});

export { publishInstagramPost };

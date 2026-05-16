import { ApiError } from "../../../utils/ApiError.js";
import { logger } from "../../../utils/logger.js";
import {
    createPost,
    findPostById,
    findPostByIdForSeller,
    findProcessingPosts,
    updatePostById,
} from "../../../repositories/post.repository.js";
import { findProductById } from "../../../repositories/product.repository.js";
import { findSellerById } from "../../../repositories/seller.repository.js";
import { createCarouselContainer } from "./createCarouselContainer.js";
import { createImageContainer } from "./createImageContainer.js";
import { getContainerStatus } from "./getContainerStatus.js";
import { publishContainer } from "./publishContainer.js";

const DEFAULT_CHILD_POLL_INTERVAL_MS = 3000;
const DEFAULT_CHILD_POLL_MAX_RETRIES = 20;
const DEFAULT_PUBLISH_POLL_INTERVAL_MS = 5000;
const DEFAULT_PUBLISH_POLL_MAX_RETRIES = 24;

const toPositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getPhaseOnePollConfig = () => ({
    intervalMs: toPositiveInteger(
        process.env.INSTAGRAM_CHILD_STATUS_POLL_INTERVAL_MS,
        DEFAULT_CHILD_POLL_INTERVAL_MS
    ),
    maxRetries: toPositiveInteger(
        process.env.INSTAGRAM_CHILD_STATUS_POLL_MAX_RETRIES,
        DEFAULT_CHILD_POLL_MAX_RETRIES
    ),
});

const getPhaseTwoPollConfig = () => ({
    intervalMs: toPositiveInteger(
        process.env.INSTAGRAM_PUBLISH_STATUS_POLL_INTERVAL_MS,
        DEFAULT_PUBLISH_POLL_INTERVAL_MS
    ),
    maxRetries: toPositiveInteger(
        process.env.INSTAGRAM_PUBLISH_STATUS_POLL_MAX_RETRIES,
        DEFAULT_PUBLISH_POLL_MAX_RETRIES
    ),
});

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const getInstagramErrorMessage = (error) =>
    error?.response?.data?.error?.message ||
    error?.response?.data?.error_message ||
    error?.message ||
    "Instagram publishing failed";

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
    } catch {
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

const validateSellerInstagramAccess = (seller) => {
    if (!seller?.instagramConnected) {
        throw new ApiError(400, "Instagram account is not connected");
    }

    if (!seller?.igAccessToken || !seller?.instagramId) {
        throw new ApiError(400, "Instagram access token is missing");
    }
};

const loadAndValidatePublishContext = async ({ seller, productId, caption }) => {
    validateSellerInstagramAccess(seller);

    const product = await findProductById(productId);

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
        throw new ApiError(
            400,
            "Instagram carousel supports a maximum of 6 images for this product"
        );
    }

    imageUrls.forEach(validateInstagramImageUrl);

    return {
        product,
        imageUrls,
        trimmedCaption: caption.trim(),
        isSingleImagePost: imageUrls.length === 1,
    };
};

const waitForContainerToFinish = async ({
    accessToken,
    containerId,
    intervalMs,
    maxRetries,
    logContext,
}) => {
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        const containerStatus = await getContainerStatus({
            creationId: containerId,
            accessToken,
        });

        logger.info("instagram.container.status_polled", {
            ...logContext,
            attempt,
            containerId,
            statusCode: containerStatus.statusCode,
            status: containerStatus.status,
        });

        if (containerStatus.statusCode === "FINISHED") {
            return containerStatus;
        }

        if (
            containerStatus.statusCode === "ERROR" ||
            containerStatus.statusCode === "EXPIRED"
        ) {
            throw new Error(
                `Instagram container ${containerId} became ${containerStatus.statusCode}`
            );
        }

        if (attempt < maxRetries) {
            await sleep(intervalMs);
        }
    }

    throw new Error(`Instagram container ${containerId} was not ready before timeout`);
};

const createInstagramContainers = async ({
    seller,
    imageUrls,
    caption,
    isSingleImagePost,
}) => {
    if (isSingleImagePost) {
        const instagramContainerId = await createImageContainer({
            igUserId: seller.instagramId,
            accessToken: seller.igAccessToken,
            imageUrl: imageUrls[0],
            caption,
        });

        logger.info("instagram.container.created", {
            sellerId: String(seller._id),
            type: "single",
            instagramContainerId,
        });

        return {
            instagramContainerId,
            childContainerIds: [],
        };
    }

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

    logger.info("instagram.carousel.children_created", {
        sellerId: String(seller._id),
        childContainerIds,
    });

    const phaseOnePollConfig = getPhaseOnePollConfig();

    await Promise.all(
        childContainerIds.map((containerId) =>
            waitForContainerToFinish({
                accessToken: seller.igAccessToken,
                containerId,
                intervalMs: phaseOnePollConfig.intervalMs,
                maxRetries: phaseOnePollConfig.maxRetries,
                logContext: {
                    sellerId: String(seller._id),
                    phase: "child_container_processing",
                },
            })
        )
    );

    const instagramContainerId = await createCarouselContainer({
        igUserId: seller.instagramId,
        accessToken: seller.igAccessToken,
        children: childContainerIds,
        caption,
    });

    logger.info("instagram.carousel.container_created", {
        sellerId: String(seller._id),
        instagramContainerId,
        childContainerIds,
    });

    return {
        instagramContainerId,
        childContainerIds,
    };
};

const markPostFailed = async (postId, errorMessage) => {
    const updatedPost = await updatePostById(postId, {
        status: "failed",
        errorMessage,
    });

    logger.error("instagram.publish.failed", {
        postId: String(postId),
        errorMessage,
    });

    return updatedPost;
};

const startInstagramPublishJob = async ({ seller, productId, caption }) => {
    try {
        const publishContext = await loadAndValidatePublishContext({
            seller,
            productId,
            caption,
        });

        const { instagramContainerId } = await createInstagramContainers({
            seller,
            imageUrls: publishContext.imageUrls,
            caption: publishContext.trimmedCaption,
            isSingleImagePost: publishContext.isSingleImagePost,
        });

        const post = await createPost({
            sellerId: seller._id,
            productId: publishContext.product._id,
            type: publishContext.isSingleImagePost ? "single" : "carousel",
            caption: publishContext.trimmedCaption,
            instagramContainerId,
            status: "processing",
            errorMessage: null,
            instagramMediaId: null,
            publishedAt: null,
        });

        logger.info("instagram.publish.job_created", {
            postId: String(post._id),
            sellerId: String(seller._id),
            productId: String(productId),
            instagramContainerId,
        });

        const workerModule = await import("../../../workers/instagramPublish.worker.js");
        workerModule.enqueueInstagramPublish(post._id.toString());

        return {
            postId: post._id,
            status: post.status,
        };
    } catch (error) {
        const message =
            error instanceof ApiError ? error.message : getInstagramErrorMessage(error);

        logger.error("instagram.publish.job_creation_failed", {
            sellerId: String(seller?._id || ""),
            productId: String(productId || ""),
            error,
            message,
        });

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(502, message);
    }
};

const processInstagramPublishJob = async (postId) => {
    const post = await findPostById(postId);

    if (!post) {
        logger.warn("instagram.publish.post_missing", { postId: String(postId) });
        return null;
    }

    if (post.status !== "processing") {
        logger.info("instagram.publish.skipped_non_processing", {
            postId: String(postId),
            status: post.status,
        });
        return post;
    }

    const seller = await findSellerById(post.sellerId);

    if (!seller) {
        return markPostFailed(postId, "Seller not found for Instagram publish job");
    }

    try {
        validateSellerInstagramAccess(seller);

        const phaseTwoPollConfig = getPhaseTwoPollConfig();

        await waitForContainerToFinish({
            accessToken: seller.igAccessToken,
            containerId: post.instagramContainerId,
            intervalMs: phaseTwoPollConfig.intervalMs,
            maxRetries: phaseTwoPollConfig.maxRetries,
            logContext: {
                postId: String(postId),
                sellerId: String(seller._id),
                phase: "publish_container_processing",
            },
        });

        const instagramMediaId = await publishContainer({
            igUserId: seller.instagramId,
            accessToken: seller.igAccessToken,
            creationId: post.instagramContainerId,
        });

        const publishedPost = await updatePostById(postId, {
            instagramMediaId,
            status: "published",
            publishedAt: new Date(),
            errorMessage: null,
        });

        logger.info("instagram.publish.completed", {
            postId: String(postId),
            sellerId: String(seller._id),
            instagramContainerId: post.instagramContainerId,
            instagramMediaId,
        });

        return publishedPost;
    } catch (error) {
        const errorMessage = getInstagramErrorMessage(error);
        return markPostFailed(postId, errorMessage);
    }
};

const getInstagramPostStatusById = async ({ postId, sellerId }) => {
    const post = await findPostByIdForSeller({ postId, sellerId });

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    return {
        status: post.status,
        instagramMediaId: post.instagramMediaId || null,
        errorMessage: post.errorMessage || null,
    };
};

const getProcessingInstagramPosts = async () => findProcessingPosts();

export {
    getInstagramPostStatusById,
    getProcessingInstagramPosts,
    processInstagramPublishJob,
    startInstagramPublishJob,
};

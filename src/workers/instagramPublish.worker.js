import { logger } from "../utils/logger.js";
import {
    getProcessingInstagramPosts,
    processInstagramPublishJob,
} from "../services/outfit/instagram/instagramPublishing.service.js";

const queuedOrRunningPosts = new Set();

const runInstagramPublishJob = async (postId) => {
    try {
        await processInstagramPublishJob(postId);
    } catch (error) {
        logger.error("instagram.publish.worker_crashed", {
            postId: String(postId),
            error,
        });
    } finally {
        queuedOrRunningPosts.delete(String(postId));
    }
};

const enqueueInstagramPublish = (postId, delayMs = 0) => {
    const normalizedPostId = String(postId);

    if (queuedOrRunningPosts.has(normalizedPostId)) {
        logger.info("instagram.publish.already_enqueued", {
            postId: normalizedPostId,
        });
        return false;
    }

    queuedOrRunningPosts.add(normalizedPostId);

    setTimeout(() => {
        void runInstagramPublishJob(normalizedPostId);
    }, delayMs);

    logger.info("instagram.publish.enqueued", {
        postId: normalizedPostId,
        delayMs,
    });

    return true;
};

const startInstagramPublishWorker = async () => {
    const processingPosts = await getProcessingInstagramPosts();

    logger.info("instagram.publish.worker_started", {
        processingPosts: processingPosts.length,
    });

    processingPosts.forEach((post) => {
        enqueueInstagramPublish(post._id.toString(), 0);
    });
};

export { enqueueInstagramPublish, startInstagramPublishWorker };

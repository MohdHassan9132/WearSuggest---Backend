import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { JWTVerify } from "../middleware/auth.middleware.js";
import { rateLimiter } from "../middleware/rateLimit.middleware.js";
import {
    createTryOn,
    getTryOnStatus,
    getUserTryOns,
    createTryOnV21,
    getTryOnStatusV21,
} from "../controllers/virtualTryOn.controller.js";

const router = Router();

router.post(
    "/",
    rateLimiter(24 * 24 * 60 * 60 * 1000, 1),
    upload.single("human"),
    createTryOn
);

router.get(
    "/:id",
    rateLimiter(24 * 24 * 60 * 60 * 1000, 1),
    JWTVerify,
    getTryOnStatus
);

router.get(
    "/",
    rateLimiter(24 * 24 * 60 * 60 * 1000, 1),
    JWTVerify,
    getUserTryOns
);
router.post(
    "/v21",
    rateLimiter(24 * 24 * 60 * 60 * 1000, 1),
    upload.single("human"),
    createTryOnV21
);
router.get(
    "/v21/:id",
    rateLimiter(24 * 24 * 60 * 60 * 1000, 1),
    JWTVerify,
    getTryOnStatusV21
);

export default router;

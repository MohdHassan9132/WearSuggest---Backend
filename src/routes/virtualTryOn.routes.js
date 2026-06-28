import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { JWTVerify, verifyUser } from "../middleware/auth.middleware.js";
import { rateLimiter } from "../middleware/rateLimit.middleware.js";
import {
    outfit,
} from "../controllers/virtualTryOn.controller.js";

const router = Router();

router.post(
    "/outfit",JWTVerify,upload.fields([
    {name: "cloth1",maxCount: 1},
    {name: "cloth2",maxCount: 1},
    {name: "cloth3",maxCount: 1},
    {name: "modelPhoto",maxCount:1}
    ]),
    outfit
)
export default router;

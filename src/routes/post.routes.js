import { Router } from "express";
import {
    getInstagramPostStatus,
    publishInstagramPost,
} from "../controllers/post.controller.js";
import { JWTVerify, verifySeller } from "../middleware/auth.middleware.js";

const postRouter = Router();

postRouter
    .route("/publish-instagram-post/:productId")
    .post(JWTVerify, verifySeller, publishInstagramPost);
postRouter
    .route("/status/:postId")
    .get(JWTVerify, verifySeller, getInstagramPostStatus);

export default postRouter;

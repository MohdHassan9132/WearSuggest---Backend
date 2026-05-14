import { Router } from "express";
import { publishInstagramPost } from "../controllers/post.controller.js";
import { JWTVerify, verifySeller } from "../middleware/auth.middleware.js";

const postRouter = Router();

postRouter
    .route("/publish-instagram-post/:productId")
    .post(JWTVerify, verifySeller, publishInstagramPost);

export default postRouter;

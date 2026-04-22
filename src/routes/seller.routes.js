import { Router } from "express";
import {
    getCurrentSeller,
    loginSeller,
    logoutSeller,
    refreshAccessToken,
    registerSeller,
} from "../controllers/seller.controller.js";
import { JWTVerify, verifySeller } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const sellerRouter = Router();

sellerRouter.route("/register-seller").post(upload.single("avatar"), registerSeller);
sellerRouter.route("/login-seller").post(loginSeller);
sellerRouter.route("/logout-seller").post(JWTVerify, verifySeller, logoutSeller);
sellerRouter.route("/refresh-access-token").post(refreshAccessToken);
sellerRouter
    .route("/get-current-seller")
    .get(JWTVerify, verifySeller, getCurrentSeller);

export default sellerRouter;

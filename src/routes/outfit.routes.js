import { Router } from "express";
import { JWTVerify, verifyUser } from "../middleware/auth.middleware.js";
import {
  suggestOutfit,
  suggestToneBasedOutfit,
  getRecentOutfits,
} from "../controllers/outfit.controller.js";

const router = Router();
router.post("/suggest", JWTVerify, verifyUser,suggestOutfit);
router.post("/suggest-tone", JWTVerify, verifyUser,suggestToneBasedOutfit);
router.get("/recent", JWTVerify,verifyUser, getRecentOutfits);

export default router;

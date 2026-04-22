import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { JWTVerify } from "../middleware/auth.middleware.js";
import {
  createTryOn,
  getTryOnStatus,
  getUserTryOns,
  createTryOnV21,
  getTryOnStatusV21
} from "../controllers/virtualTryOn.controller.js";

const router = Router();


router.post("/",JWTVerify ,upload.single("human"), createTryOn);

router.get("/:id", JWTVerify,getTryOnStatus);

router.get("/",JWTVerify,getUserTryOns);
router.post("/v21", upload.single("human"), createTryOnV21);
router.get("/v21/:id", JWTVerify,getTryOnStatusV21);

export default router;